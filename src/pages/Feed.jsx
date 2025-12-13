import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { listVideos } from "@/api/videos";
import { listPosts, listComments, listPolls } from "@/api/posts";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Lock,
    Video as VideoIcon,
    FileText,
    BarChart3,
    Image as ImageIcon,
} from "lucide-react";
import FeedItem from "../components/feed/FeedItem";
import CreatePostForm from "../components/feed/CreatePostForm";
import SuggestionsSection from "../components/feed/SuggestionsSection";
import AdminSuggestionsView from "../components/feed/AdminSuggestionsView";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FeedPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [feedItems, setFeedItems] = useState([]);
    const [comments, setComments] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [filter, setFilter] = useState("all"); // "all", "videos", "posts", "polls", "images"

    useEffect(() => {
        if (!authLoading) {
            loadFeed();
        }
    }, [authLoading]);

    const loadFeed = async () => {
        setLoading(true);
        try {
            const [videosResult, postsResult, pollsResult, commentsResult] =
                await Promise.all([
                    listVideos("-created_at"),
                    listPosts("-created_at"),
                    listPolls("-created_at"),
                    listComments("-created_at"),
                ]);

            const videos = videosResult.data || [];
            const posts = postsResult.data || [];
            const polls = pollsResult.data || [];
            const allComments = commentsResult.data || [];

            // Combine and sort by date
            const combined = [
                ...videos.map((v) => ({
                    ...v,
                    type: "video",
                    created_date: v.created_at,
                })),
                ...posts.map((p) => ({
                    ...p,
                    type: p.image_url && !p.content ? "image" : "post",
                    created_date: p.created_at,
                })),
                ...polls.map((p) => ({
                    ...p,
                    type: "poll",
                    created_date: p.created_at,
                })),
            ].sort(
                (a, b) => new Date(b.created_date) - new Date(a.created_date)
            );

            setFeedItems(combined);

            // Group comments by video_id, post_id, and poll_id
            const commentMap = {};
            allComments.forEach((comment) => {
                const key =
                    comment.video_id || comment.post_id || comment.poll_id;
                if (!commentMap[key]) commentMap[key] = [];
                commentMap[key].push(comment);
            });
            setComments(commentMap);
        } catch (error) {
            console.error("Error loading feed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateComplete = () => {
        setShowCreateForm(false);
        loadFeed();
    };

    const handleCommentAdded = () => {
        loadFeed();
    };

    const isAdmin = user?.role === "admin";
    const hasSubscriberAccess = user?.subscription_status === "subscriber";

    const filteredItems = feedItems.filter((item) => {
        if (filter === "all") return true;
        if (filter === "videos") return item.type === "video";
        if (filter === "posts") return item.type === "post";
        if (filter === "polls") return item.type === "poll";
        if (filter === "images") return item.type === "image";
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="font-mono text-xs animate-pulse">
                    loading feed...
                </div>
            </div>
        );
    }

    // Free users see locked message
    if (!hasSubscriberAccess && !isAdmin) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center py-20">
                    <div className="text-center border-2 border-black bg-white p-12 max-w-lg">
                        <Lock className="w-16 h-16 mx-auto mb-6" />
                        <h2 className="font-heavy text-xl mb-4">
                            subscriber access required
                        </h2>
                        <p className="font-mono text-sm mb-6">
                            community feed access is available exclusively to
                            subscribers. upgrade your account to view and
                            participate in discussions.
                        </p>
                        <button
                            onClick={() => navigate(createPageUrl("Subscribe"))}
                            className="bg-black text-white border border-black rounded-none font-heavy text-sm px-8 py-4 hover:bg-gray-800"
                        >
                            ★ upgrade to subscriber ★
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Admin Suggestions View */}
            {isAdmin && <AdminSuggestionsView />}

            {/* Suggestions Section */}
            <SuggestionsSection user={user} isAdmin={isAdmin} />

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-heavy text-gray-900">
                    community feed
                </h1>
                {isAdmin && (
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-black text-white border border-black rounded-none font-heavy text-xs tracking-wide hover:bg-gray-800"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        create post
                    </Button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 border-b-2 border-black overflow-x-auto">
                <button
                    onClick={() => setFilter("all")}
                    className={`font-heavy text-sm px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                        filter === "all"
                            ? "border-black text-black"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    all
                </button>
                <button
                    onClick={() => setFilter("videos")}
                    className={`font-heavy text-sm px-4 py-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                        filter === "videos"
                            ? "border-black text-black"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <VideoIcon className="w-4 h-4" />
                    videos
                </button>
                <button
                    onClick={() => setFilter("images")}
                    className={`font-heavy text-sm px-4 py-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                        filter === "images"
                            ? "border-black text-black"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <ImageIcon className="w-4 h-4" />
                    images
                </button>
                <button
                    onClick={() => setFilter("posts")}
                    className={`font-heavy text-sm px-4 py-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                        filter === "posts"
                            ? "border-black text-black"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    posts
                </button>
                <button
                    onClick={() => setFilter("polls")}
                    className={`font-heavy text-sm px-4 py-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                        filter === "polls"
                            ? "border-black text-black"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    polls
                </button>
            </div>

            {isAdmin && showCreateForm && (
                <CreatePostForm onCreateComplete={handleCreateComplete} />
            )}

            {filteredItems.length === 0 ? (
                <div className="text-center p-12 text-gray-400 border border-dashed border-gray-400">
                    <h3 className="font-heavy text-sm">no posts yet</h3>
                    {isAdmin && (
                        <p className="font-mono text-xs mt-2">
                            create your first post using the button above.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {filteredItems.map((item) => (
                        <FeedItem
                            key={item.id}
                            item={item}
                            comments={comments[item.id] || []}
                            user={user}
                            isAdmin={isAdmin}
                            onCommentAdded={handleCommentAdded}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
