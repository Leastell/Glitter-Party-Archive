import { useAuth } from "@/context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * ProtectedAdminRoute - Restricts access to admin users only
 * Redirects non-admins to home page
 */
export default function ProtectedAdminRoute({ children }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Show loading state while auth is loading
    if (user === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <p className="font-semibold mb-2">Access Denied</p>
                        <p className="text-sm mb-4">
                            You must be logged in to access this page.
                        </p>
                        <button
                            onClick={() => navigate(createPageUrl("Home"))}
                            className="text-sm font-medium underline hover:no-underline"
                        >
                            Return to Home
                        </button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Authenticated but not admin
    if (user.role !== "admin") {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <p className="font-semibold mb-2">Admin Only</p>
                        <p className="text-sm mb-4">
                            This page is restricted to administrators only.
                        </p>
                        <button
                            onClick={() => navigate(createPageUrl("Home"))}
                            className="text-sm font-medium underline hover:no-underline"
                        >
                            Return to Home
                        </button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Admin user - render children
    return children;
}
