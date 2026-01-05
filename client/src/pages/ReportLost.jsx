import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Calendar, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ClaimModal from '../components/ClaimModal';

export default function ReportLost() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null); // For Modal
    const [showForm, setShowForm] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        category: 'Electronics',
        description: '',
        location: '',
        dateLost: new Date().toISOString().split('T')[0]
    });

    // 🔎 Smart Search: Check if item is already found!
    const checkForMatches = async () => {
        if (formData.title.length < 3) return;

        // Simple search (for hackathon). In production, use Algolia/ElasticSearch.
        // We check if any 'found' item has the same category.
        const q = query(
            collection(db, "items"),
            where("type", "==", "found"),
            where("category", "==", formData.category),
            where("status", "==", "open")
        );

        const snapshot = await getDocs(q);
        const results = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            // logic: match title words loosely
            .filter(item => {
                const searchWords = formData.title.toLowerCase().split(' ');
                const itemWords = (item.title + ' ' + item.tags.join(' ')).toLowerCase();
                return searchWords.some(word => itemWords.includes(word));
            });

        setMatches(results);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "items"), {
                ...formData,
                type: 'lost',
                reporter_uid: currentUser.uid,
                reporter_email: currentUser.email,
                status: 'open',
                timestamp: serverTimestamp()
            });

            // Navigate to dashboard with success state
            navigate('/dashboard', { state: { msg: 'Lost report submitted. We will notify you if found!' } });

        } catch (err) {
            console.error(err);
            alert("Failed to submit. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

                {/* Left: The Form */}
                <div>
                    <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-800 mb-6 block">
                        &larr; Back to Dashboard
                    </button>

                    <div className="glass-card p-6 md:p-8">
                        <h1 className="text-2xl font-bold text-red-600 mb-2">Report Lost Item</h1>
                        <p className="text-slate-500 mb-8">Help us identify what you lost so we can notify you.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">What did you lose?</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Black Sony Headphones"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    onBlur={checkForMatches} // Trigger search on blur
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select
                                        className="input-field"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option>Electronics</option>
                                        <option>Books</option>
                                        <option>ID-Cards</option>
                                        <option>Clothing</option>
                                        <option>Others</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={formData.dateLost}
                                        onChange={(e) => setFormData({ ...formData, dateLost: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Last Seen Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        className="input-field pl-10"
                                        placeholder="e.g. Canteen Table 5"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
                                <textarea
                                    rows="4"
                                    className="input-field"
                                    placeholder="Provide unique details (scratches, stickers) to prove ownership later..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Submit Lost Report"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Live Matches (The "Smart" Part) */}
                <div className="flex flex-col h-full">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Search size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Similar Found Items</h3>
                                <p className="text-sm text-slate-500">We found these items that match your description.</p>
                            </div>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {matches.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <Search size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p>Start typing to see potential matches...</p>
                                </div>
                            ) : (
                                matches.map(item => (
                                    <motion.div
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                                                <p className="text-xs text-slate-500 mb-2">Found {new Date(item.timestamp.seconds * 1000).toLocaleDateString()}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.tags?.slice(0, 3).map((t, i) => (
                                                        <span key={i} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">#{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button className="self-center p-2 text-blue-600 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {matches.length > 0 && (
                            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg flex items-start gap-2">
                                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                <p>If you see your item here, click it to start the <b>Claim Verification Process</b>.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <ClaimModal item={selectedItem} onClose={() => setSelectedItem(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
