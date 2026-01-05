import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Client-side domain check for immediate feedback
            // Note: Backend has a stricter check, but this improves UX.
            if (!user.email.endsWith("@iare.ac.in")) {
                await signOut(auth);
                throw new Error("Access Restricted: Please login with your official @iare.ac.in email.");
            }
            return user;
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // If a user logs in but somehow isn't valid (unlikely due to login check, but good for safety)
            if (user && !user.email.endsWith("@iare.ac.in")) {
                signOut(auth);
                setCurrentUser(null);
            } else {
                setCurrentUser(user);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
