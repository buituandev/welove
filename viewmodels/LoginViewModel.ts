
import { useState } from "react";
import { signInWithGoogle } from "../services/login";
import { useToast } from "heroui-native/toast";

export const useLoginViewModel = () => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const handleGoogleLogin = async () => {
        try {
            setIsSigningIn(true);
            setError(null);
            await signInWithGoogle();
        } catch (err: any) {
            console.warn("Google login error", err);
            setError(err);
            
            const msg = err.message || String(err);
            let description = msg;
            if (msg.includes("NoCredentialException") || msg.includes("No Google account found")) {
                description = "No Google account found. Please add a Google account in Settings > Accounts on your device.";
            }
            
            toast.show({
                label: "Sign-in Error",
                description: description,
                variant: "danger",
            });
        } finally {
            setIsSigningIn(false);
        }
    };

    return {
        isSigningIn,
        error,
        handleGoogleLogin,
        clearError: () => setError(null),
    };
};
