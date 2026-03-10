import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { createSuggestion } from "@/api/suggestions";
import { Input } from "@/components/ui/input";

export default function SuggestionsSection() {
    const { user: authUser } = useAuth();
    const [suggestion, setSuggestion] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!suggestion.trim() || !authUser?.id) return;

        setSubmitting(true);
        try {
            // Use first 50 chars as title, full text as description
            const title =
                suggestion.trim().substring(0, 50) +
                (suggestion.length > 50 ? "..." : "");

            const { error } = await createSuggestion(authUser.id, {
                title,
                description: suggestion.trim(),
            });

            if (error) throw error;

            setSuggestion("");
            alert("Thank you! Your suggestion has been submitted.");
        } catch (error) {
            console.error("Failed to submit suggestion:", error);
            alert("Failed to submit suggestion. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="border border-black bg-[#f5f1e8] p-4 mb-8">
            <h2 className="font-heavy text-sm tracking-tight leading-none mb-3">
                suggestions
            </h2>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="share an idea..."
                    className="flex-1 font-mono text-xs border border-black rounded-none bg-white focus:ring-0 focus:border-black h-9"
                    required
                />

                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-black text-white font-mono text-[10px] tracking-[0.15em] uppercase px-4 hover:bg-gray-800 transition-colors disabled:bg-gray-400 whitespace-nowrap"
                >
                    {submitting ? "..." : "submit"}
                </button>
            </form>
        </div>
    );
}
