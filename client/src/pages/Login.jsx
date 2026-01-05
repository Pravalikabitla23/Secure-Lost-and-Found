import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Search, Database } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        try {
            setError("");
            setLoading(true);
            await login();
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || "Failed to log in");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/30 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>

            <div className="glass-card w-full max-w-4xl grid md:grid-cols-2 overflow-hidden shadow-2xl relative z-10">

                {/* Left Side: Branding */}
                <div className="p-10 flex flex-col justify-center bg-white/40 backdrop-blur-sm border-r border-white/20">
                    <div className="mb-8">
                        <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-2">IARE College</h2>
                        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Lost & Found</h1>
                        <p className="text-slate-600 text-lg">Secure. Verified. AI-Powered.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg text-primary">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800">Verified Access</h3>
                                <p className="text-sm text-slate-500">Only @iare.ac.in emails allowed</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg text-secondary">
                                <Search size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800">Smart Matching</h3>
                                <p className="text-sm text-slate-500">Powered by Google Gemini AI</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-lg text-yellow-700">
                                <Database size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800">Instant Retrieve</h3>
                                <p className="text-sm text-slate-500">Real-time updates via Firestore</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Action */}
                <div className="p-10 flex flex-col justify-center items-center bg-white/60">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                        <p className="text-slate-500">Login to report or claim lost items.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm text-center w-full">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full max-w-xs group relative flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-slate-400 border-t-primary rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                    className="w-5 h-5"
                                />
                                <span>Sign in with IARE Email</span>
                            </>
                        )}

                    </button>

                    <p className="mt-8 text-xs text-center text-slate-400">
                        By logging in, you agree to the college's data privacy policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
