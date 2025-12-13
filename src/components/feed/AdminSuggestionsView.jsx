import React, { useState, useEffect } from "react";
import { listSuggestions, updateSuggestionStatus } from "@/api/suggestions";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function AdminSuggestionsView() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        setLoading(true);
        try {
            const { data } = await listSuggestions("-created_at");
            setSuggestions(data || []);
        } catch (error) {
            console.error("Failed to load suggestions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (suggestionId, newStatus) => {
        try {
            const { error } = await updateSuggestionStatus(
                suggestionId,
                newStatus
            );
            if (error) throw error;
            loadSuggestions();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-300";
            case "reviewing":
                return "bg-blue-100 text-blue-800 border-blue-300";
            case "accepted":
                return "bg-green-100 text-green-800 border-green-300";
            case "declined":
                return "bg-gray-100 text-gray-600 border-gray-300";
            default:
                return "bg-gray-100 text-gray-600 border-gray-300";
        }
    };

    if (loading) {
        return (
            <div className="border border-black bg-[#f5f1e8] p-4 mb-8">
                <p className="font-mono text-xs">loading suggestions...</p>
            </div>
        );
    }

    return (
        <div className="border border-black bg-[#f5f1e8] mb-8">
            {/* Header */}
            <div
                className="border-b border-black p-4 cursor-pointer hover:bg-[#eee9dd] transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="font-heavy text-lg tracking-tight leading-none">
                            admin: view suggestions
                        </h2>
                        <span className="font-mono text-xs px-2 py-1 bg-black text-white">
                            {suggestions.length}
                        </span>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </div>
            </div>

            {/* Suggestions List */}
            {isExpanded && (
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    {suggestions.length === 0 ? (
                        <p className="font-mono text-xs text-gray-600">
                            no suggestions yet.
                        </p>
                    ) : (
                        suggestions.map((suggestion) => (
                            <div
                                key={suggestion.id}
                                className="bg-white border border-black p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-heavy text-sm mb-1">
                                            {suggestion.title}
                                        </h3>
                                        <p className="font-mono text-xs text-gray-600">
                                            {suggestion.user_id &&
                                                `by user ${suggestion.user_id.substring(
                                                    0,
                                                    8
                                                )}...`}{" "}
                                            •{" "}
                                            {new Date(
                                                suggestion.created_at
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`font-mono text-[10px] px-2 py-1 border ${getStatusColor(
                                            suggestion.status
                                        )}`}
                                    >
                                        {suggestion.status}
                                    </span>
                                </div>

                                <p className="font-mono text-xs text-gray-700 mb-3 leading-relaxed">
                                    {suggestion.description}
                                </p>

                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-gray-600">
                                        status:
                                    </span>
                                    <Select
                                        value={suggestion.status}
                                        onValueChange={(value) =>
                                            handleStatusChange(
                                                suggestion.id,
                                                value
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-32 h-7 font-mono text-xs border border-black rounded-none bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border border-black rounded-none bg-white">
                                            <SelectItem value="pending">
                                                pending
                                            </SelectItem>
                                            <SelectItem value="reviewing">
                                                reviewing
                                            </SelectItem>
                                            <SelectItem value="accepted">
                                                accepted
                                            </SelectItem>
                                            <SelectItem value="declined">
                                                declined
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
