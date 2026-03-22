import { createContext, useContext, useEffect, useState } from "react";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, db } from "../firebase";

export interface AppUser {
    uid: string;
    name: string;
    email: string;
    role: "owner" | "employee";
    createdAt: number;
}

export interface AuthState {
    firebaseUser: FirebaseUser | null;
    appUser: AppUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
    firebaseUser: null,
    appUser: null,
    loading: true,
    login: async () => { },
    signup: async () => { },
    logout: async () => { },
});

export const useAuth = (): AuthState => useContext(AuthContext);

export const useAuthState = (): AuthState => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user) {
                const userRef = ref(db, `users/${user.uid}`);
                const snap = await get(userRef);
                if (snap.exists()) {
                    setAppUser({ uid: user.uid, ...snap.val() } as AppUser);
                } else {
                    const newUser: AppUser = {
                        uid: user.uid,
                        name: user.displayName || user.email?.split("@")[0] || "User",
                        email: user.email || "",
                        role: "employee",
                        createdAt: Date.now(),
                    };
                    await set(userRef, newUser);
                    setAppUser(newUser);
                }
            } else {
                setAppUser(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async (name: string, email: string, password: string): Promise<void> => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        const newUser: AppUser = {
            uid: cred.user.uid,
            name,
            email,
            role: "employee",
            createdAt: Date.now(),
        };
        await set(ref(db, `users/${cred.user.uid}`), newUser);
    };

    const logout = async (): Promise<void> => {
        await signOut(auth);
        setAppUser(null);
        setFirebaseUser(null);
    };

    return { firebaseUser, appUser, loading, login, signup, logout };
};