import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, PlusCircle, Search, Clock, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ClaimModal from '../components/ClaimModal';

export default function Dashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState('all'); // all | lost | found
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        // Real-time listener for items
        const q = query(collection(db, "items"), orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const liveItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItems(liveItems);
        });

        return () => unsubscribe();
    }, []);

    const filteredItems = items.filter(item => filter === 'all' || item.type === filter);

    return (
        <div className="min-h-screen bg-slate-50 relative pb-20">

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
                            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold">
                                LF
                            </div>
                            <span className="font-bold text-xl text-slate-800 tracking-tight">Lost<span className="text-primary">&</span>Found</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-medium text-slate-900">{currentUser?.displayName || "Student"}</p>
                                <p className="text-xs text-slate-500">{currentUser?.email}</p>
                            </div>
                            <img
                                src={currentUser?.photoURL || "https://ui-avatars.com/api/?name=User"}
                                alt="Profile"
                                className="h-9 w-9 rounded-full border border-gray-200"
                            />
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero / Stats Area */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-2">Lost something?</h2>
                            <p className="text-blue-100 mb-6 max-w-sm">Report it immediately so our AI matching system can help you find it.</p>
                            <div className="flex gap-3">
                                <button onClick={() => navigate('/report-lost')} className="bg-white text-primary font-semibold py-2 px-4 rounded-full shadow hover:bg-blue-50 transition active:scale-95">
                                    I Lost Something
                                </button>
                                <button onClick={() => navigate('/report-found')} className="bg-blue-500/30 backdrop-blur-sm border border-white/30 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-500/40 transition active:scale-95">
                                    I Found Something
                                </button>
                            </div>
                        </div>
                        <div className="absolute right-[-20px] bottom-[-40px] opacity-20 text-white">
                            <Search size={180} />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                        <h3 className="text-4xl font-bold text-secondary mb-1">
                            {items.filter(i => i.status === 'returned').length}
                        </h3>
                        <p className="text-slate-500 font-medium">Items Returned</p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                        <h3 className="text-4xl font-bold text-orange-500 mb-1">
                            {items.filter(i => i.status === 'open').length}
                        </h3>
                        <p className="text-slate-500 font-medium">Active Reports</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
                        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-gray-50'}`}>All</button>
                        <button onClick={() => setFilter('lost')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'lost' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-gray-50'}`}>Lost</button>
                        <button onClick={() => setFilter('found')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'found' ? 'bg-green-50 text-green-600' : 'text-slate-600 hover:bg-gray-50'}`}>Found</button>
                    </div>
                </div>

                {/* Items Grid */}
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <p className="text-slate-400">No items found in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => item.type === 'found' && setSelectedItem(item)}
                                className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl transition-all duration-300 cursor-pointer"
                            >
                                <div className="relative aspect-video rounded-xl bg-slate-100 mb-4 overflow-hidden">
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm z-10">
                                        <span className={item.type === 'found' ? 'text-green-600' : 'text-red-600'}>
                                            {item.type}
                                        </span>
                                    </div>

                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Search size={40} />
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-bold text-slate-800 mb-2 truncate">{item.title}</h3>

                                <div className="space-y-2 text-sm text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} />
                                        <span>{item.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} />
                                        <span>{item.timestamp ? new Date(item.timestamp?.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {item.tags?.slice(0, 3).map((tag, idx) => (
                                        <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">#{tag}</span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Claim Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <ClaimModal item={selectedItem} onClose={() => setSelectedItem(null)} />
                )}
            </AnimatePresence>

        </div>
    );
}
