import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { functions, db, storage } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { Upload, Camera, Loader2, CheckCircle, Tag, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportFound() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category: 'Others',
        color: '',
        brand: '',
        description: '',
        tags: [],
        location: '',
        hiddenDetails: '' // Crucial for security
    });

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            analyzeImageWithAI(selected);
        }
    };

    // 🧠 The AI Magic
    const analyzeImageWithAI = async (imageFile) => {
        setAnalyzing(true);
        setError('');

        try {
            // 1. Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);

            reader.onloadend = async () => {
                const base64Data = reader.result.split(',')[1];

                try {
                    // 2. Call Cloud Function
                    const analyzeFn = httpsCallable(functions, 'analyzeItemImage');
                    const result = await analyzeFn({
                        imageBase64: base64Data,
                        mimeType: imageFile.type
                    });

                    const aiData = result.data;
                    console.log("AI Analysis Result:", aiData);

                    // 3. Auto-fill Form
                    setFormData(prev => ({
                        ...prev,
                        title: aiData.title || '',
                        category: aiData.category || 'Others',
                        color: aiData.color || '',
                        brand: aiData.brand || '',
                        description: aiData.description || '',
                        tags: aiData.tags || []
                    }));

                } catch (err) {
                    console.error("AI Error:", err);
                    setError("AI could not analyze the image. Please fill details manually.");
                } finally {
                    setAnalyzing(false);
                }
            };
        } catch (err) {
            setAnalyzing(false);
            setError("Failed to process image.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return setError("Please upload an image.");
        if (!formData.location) return setError("Please specify where you found it.");

        setUploading(true);


        try {
            // 1. Convert Image to Base64 (Compressed for Firestore)
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onloadend = async () => {
                const base64String = reader.result;

                // 2. Save Metadata to Firestore (Store Base64 directly!)
                await addDoc(collection(db, "items"), {
                    ...formData,
                    type: 'found',
                    image_url: base64String, // Storing directly in DB to bypass Storage issues
                    finder_uid: currentUser.uid,
                    finder_email: currentUser.email,
                    status: 'open',
                    timestamp: serverTimestamp()
                });

                alert("Item reported successfully!");
                navigate('/dashboard');
            };

        } catch (err) {
            console.error(err);
            setError("Failed to save report. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">

                <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-800 mb-6">
                    &larr; Back to Dashboard
                </button>

                <div className="glass-card p-6 md:p-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Report Found Item</h1>
                    <p className="text-slate-500 mb-8">Upload a photo and let our AI helper fill in the details.</p>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Image Upload Section */}
                        <div className="flex flex-col items-center justify-center">
                            <div
                                className={`relative w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors 
                  ${preview ? 'border-primary/50 bg-slate-50' : 'border-gray-300 hover:border-primary hover:bg-blue-50/50'}`}
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-2xl p-2" />
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="bg-blue-100 p-4 rounded-full inline-flex mb-3 text-primary">
                                            <Camera size={32} />
                                        </div>
                                        <p className="font-medium text-slate-600">Click to upload photo</p>
                                        <p className="text-sm text-slate-400">JPG, PNG supported</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />

                                {/* AI Loading State Overlay */}
                                <AnimatePresence>
                                    {analyzing && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl"
                                        >
                                            <Loader2 size={40} className="text-primary animate-spin mb-3" />
                                            <p className="font-semibold text-primary animate-pulse">Gemini AI is analyzing...</p>
                                            <p className="text-xs text-slate-500">Detecting object, color, and brand</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        {/* AI Auto-Filled Fields */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Item Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g. Blue Water Bottle"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="input-field"
                                >
                                    <option>Electronics</option>
                                    <option>Books</option>
                                    <option>ID-Cards</option>
                                    <option>Clothing</option>
                                    <option>Others</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Brand (if any)</label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field"
                                    placeholder="Auto-generated by AI..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Tag size={16} /> AI Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag, idx) => (
                                        <span key={idx} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 border-t pt-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Verification Details</h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Where did you find it?</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="input-field"
                                            placeholder="e.g. 2nd Floor Library, Table 4"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-red-600 mb-1 flex items-center gap-2">
                                            <ShieldCheck size={16} /> Hidden Details (Privately Stored)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.hiddenDetails}
                                            onChange={e => setFormData({ ...formData, hiddenDetails: e.target.value })}
                                            className="input-field border-red-200 focus:border-red-500 focus:ring-red-200"
                                            placeholder="e.g. Use a scratch on the back, or wallpaper name"
                                        />
                                        <p className="text-xs text-red-500 mt-1">
                                            * This will NOT be shown publicly. It's used by AI to verify the owner's claim.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full btn-primary py-4 text-lg shadow-xl flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>Saving... <Loader2 className="animate-spin" /></>
                            ) : (
                                "Submit Report"
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}

// Icon component needed for the layout logic above
function ShieldCheck({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
    )
}
