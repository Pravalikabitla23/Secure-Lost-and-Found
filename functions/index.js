const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// Initialize Gemini
// Note: In production, use process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAKKgqLmvNqz_xGuWweXSoj2rsfW21rYlM");

/**
 * Triggers when a new user is created.
 * Blocks login if email is not from @iare.ac.in
 */
exports.beforeCreate = functions.auth.user().beforeCreate((user, context) => {
  if (!user.email || !user.email.endsWith("@iare.ac.in")) {
    throw new functions.auth.HttpsError(
      "invalid-argument",
      "Unauthorized email domain. Only @iare.ac.in is allowed."
    );
  }
});

/**
 * HTTP Function to analyze an uploaded image using Gemini Vision.
 * Callable from Frontend.
 */
exports.analyzeItemImage = functions.https.onCall(async (data, context) => {
  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { imageBase64, mimeType } = data;
  if (!imageBase64) {
    throw new functions.https.HttpsError('invalid-argument', 'Image data missing.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const prompt = `
      Analyze this image of a lost/found item. 
      Return a PURE JSON object (no markdown) with these keys:
      {
        "title": "Short title (Max 5 words)",
        "category": "One of [Electronics, Books, ID-Cards, Clothing, Others]",
        "color": "Dominant color",
        "brand": "Brand name if visible, else null",
        "tags": ["tag1", "tag2", "tag3"],
        "description": "A concise visual description."
      }
    `;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Cleanup markup if Gemini wraps in backticks
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Gemini Error:", error);
    throw new functions.https.HttpsError('internal', 'AI Analysis Failed');
  }
});

/**
 * HTTP Function to verify ownership claim.
 */
exports.verifyClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth) return { error: "Unauthenticated" };

  const { itemId, proofDescription } = data;

  // Fetch item's hidden details from Firestore (Secure backend access)
  const itemDoc = await db.collection('items').doc(itemId).get();
  if (!itemDoc.exists) return { error: "Item not found" };

  const itemData = itemDoc.data();
  const hiddenDetails = itemData.hidden_details || "No hidden details recorded.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      Compare these two descriptions of an item to verify ownership.
      1. REAL Hidden Details (Truth): "${hiddenDetails}"
      2. Claimant's Description: "${proofDescription}"
      
      Score the match from 0 to 100 based on unique identifying features (scratches, stickers, specific content).
      Ignore generic matches like "It is black".
      
      Return JSON: { "score": number, "reason": "string" }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonStr);
  } catch (e) {
    return { error: e.message };
  }
});
