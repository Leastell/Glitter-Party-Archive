import { createContext, useContext, useEffect, useState } from "react";
import {
    getCurrentUser,
    signInWithGoogle,
    signOut,
    updateProfile,
    onAuthStateChange,
} from "@/api/auth";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error("Error initializing auth:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        const subscription = onAuthStateChange(async (event) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
                setLoading(false);
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setLoading(false);
            }
        });

        initAuth();

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    const value = {
        user,
        loading,
        signInWithGoogle,
        signOut,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
