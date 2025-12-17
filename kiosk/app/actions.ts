"use server";
import { signIn, signOut } from "../lib/auth";
import { AuthError } from "next-auth";

export async function loginCredentials(formData: FormData) {
    try {
        await signIn("credentials", formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials." };
                default:
                    return { error: "Something went wrong." };
            }
        }
        throw error;
    }
}

export async function loginGoogle() {
    try {
        await signIn("google", { redirectTo: "/menu-selector" });
    } catch (error) {
        if (error instanceof AuthError) {
            // triggered when signIn callback returns false
            if (error.type === "CallbackRouteError" || error.type === "AccessDenied") {
                return { error: "No account with this email" };
            }
            return { error: "Google sign in failed." };
        }
        throw error;
    }
}

export async function logout() {
    await signOut();
}
