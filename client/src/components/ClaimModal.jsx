import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { ShieldCheck, X, Loader2, CheckCircle, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClaimModal({ item, onClose }) {
    const [proof, setProof] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null); // { score, reason }
    const [step, setStep] = useState('input'); // input | processing | success | fail

    const handleVerify = async () => {
        if (proof.length < 10) return alert("Please provide more detail.");

        setVerifying(true);
        setStep('processing');

        try {
            // Try the real backend first
            // const verifyFn = httpsCallable(functions, 'verifyClaim');
            // const response = await verifyFn({
            //  itemId: item.id,
            //  proofDescription: proof
            // });

            // const { score, reason } = response.data;

            // FOR HACKATHON DEMO: Simulate success to ensure it works on localhost without backend
            await new Promise(resolve => setTimeout(resolve, 2000)); // Fake network delay
            const score = 88;
            const reason = "Strong match with hidden details.";

            setResult({ score, reason });

            if (score >= 70) {
                setStep('success');
            } else {
                setStep('fail');
            }
        } catch (error) {
            console.error(error);
            alert("Verification failed. Please try again.");
            setStep('input');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-500"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Claim Verification</h2>
                        <p className="text-slate-500">To prevent fraud, our AI validates your ownership.</p>
                    </div>

                    {/* Content Based on Step */}
                    {step === 'input' && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-sm font-semibold text-slate-700 mb-1">Item: {item.title}</p>
                                <p className="text-xs text-slate-500">Category: {item.category} • Color: {item.color}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Describe a unique hidden feature (scratch, mark, content):
                                </label>
                                <textarea
                                    className="input-field min-h-[120px]"
                                    placeholder="e.g. It has a sticker of 'Apple' on the bottom right..."
                                    value={proof}
                                    onChange={(e) => setProof(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleVerify}
                                disabled={verifying}
                                className="w-full btn-primary py-3"
                            >
                                Verify Ownership
                            </button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="text-center py-10">
                            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-800 animate-pulse">Gemini is analyzing...</h3>
                            <p className="text-slate-500">Comparing your proof with hidden metadata.</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-6">
                            <div className="text-green-500 mb-4 flex justify-center">
                                <CheckCircle size={64} />
                            </div>
                            <h3 className="text-2xl font-bold text-green-600 mb-2">Ownership Verified!</h3>
                            <p className="text-slate-600 mb-6">
                                Match System Confidence: <span className="font-bold">{result?.score}%</span>
                            </p>

                            <div className="bg-slate-900 text-white p-6 rounded-xl mb-4">
                                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Digital Gate Pass</p>
                                <div className="flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="font-bold text-xl">PICKUP-CODE</p>
                                        <p className="text-3xl font-mono text-yellow-400">#8X29B</p>
                                    </div>
                                    <div className="bg-white p-2 rounded">
                                        {/* Pseudocode QR */}
                                        <div className="w-16 h-16 bg-black pattern-grid-lg"></div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">Show this code at the Lost & Found Desk.</p>
                        </div>
                    )}

                    {step === 'fail' && (
                        <div className="text-center py-6">
                            <div className="text-red-500 mb-4 flex justify-center">
                                <AlertOctagon size={64} />
                            </div>
                            <h3 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h3>
                            <p className="text-slate-600 mb-4">
                                Our AI could not match your description with the item's hidden details.
                            </p>
                            <p className="text-sm bg-red-50 text-red-700 p-3 rounded-lg mb-6">
                                Reason: {result?.reason}
                            </p>
                            <button onClick={() => setStep('input')} className="text-primary hover:underline">
                                Try Again
                            </button>
                        </div>
                    )}

                </div>
            </motion.div>
        </div>
    );
}
