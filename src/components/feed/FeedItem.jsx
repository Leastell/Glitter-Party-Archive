import React, { useState, useRef } from "react";
import { deleteVideo } from "@/api/videos";
import {
    deletePost,
    deletePoll,
    createComment,
    deleteComment,
    voteOnPoll,
} from "@/api/posts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    MessageSquare,
    Trash2,
    Send,
    BarChart3,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
} from "lucide-react";
import { format } from "date-fns";

export default function FeedItem({
    item,
    comments,
    user,
    isAdmin,
    onCommentAdded,
}) {
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [votedOption, setVotedOption] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef(null);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user?.id) return;

        setSubmitting(true);
        try {
            const commentData = {
                content: newComment,
            };

            if (item.type === "video") {
                commentData.video_id = item.id;
            } else if (item.type === "poll") {
                commentData.poll_id = item.id;
            } else {
                commentData.post_id = item.id;
            }

            const { error } = await createComment(user.id, commentData);
            if (error) throw error;

            setNewComment("");
            onCommentAdded();
            setShowComments(true);
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!confirm(`Are you sure you want to delete this ${item.type}?`))
            return;

        try {
            let result;
            if (item.type === "video") {
                result = await deleteVideo(item.id);
            } else if (item.type === "poll") {
                result = await deletePoll(item.id);
            } else {
                result = await deletePost(item.id);
            }
            if (result.error) throw result.error;
            onCommentAdded();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        try {
            const result = await deleteComment(commentId);
            if (result.error) throw result.error;
            onCommentAdded();
        } catch (error) {
            console.error("Comment delete failed:", error);
        }
    };

    const handleVote = async (option) => {
        if (votedOption !== null) return; // Already voted

        try {
            const { error } = await voteOnPoll(item.id, option);
            if (error) throw error;
            setVotedOption(option);
            onCommentAdded();
        } catch (error) {
            console.error("Vote failed:", error);
        }
    };

    const getTotalVotes = () => {
        if (item.type !== "poll") return 0;
        if (!item.votes || typeof item.votes !== "object") return 0;
        return Object.values(item.votes).reduce((sum, count) => sum + count, 0);
    };

    const getVotePercentage = (option) => {
        const total = getTotalVotes();
        if (total === 0) return 0;
        const votes = item.votes?.[option] || 0;
        return Math.round((votes / total) * 100);
    };

    // Video control functions
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const progress =
                (videoRef.current.currentTime / videoRef.current.duration) *
                100;
            setProgress(progress);
        }
    };

    const handleProgressClick = (e) => {
        if (videoRef.current && videoRef.current.duration) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = pos * videoRef.current.duration;
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    };

    return (
        <div className="border-2 border-black bg-white p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-500">
                            {format(new Date(item.created_date), "MMM d, yyyy")}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 border border-gray-300">
                            {item.type}
                        </span>
                    </div>
                    <h2 className="font-heavy text-xl">
                        {item.type === "poll" ? item.question : item.title}
                    </h2>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleDeleteItem}
                        className="text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content */}
            {item.type === "video" ? (
                <div className="mb-4">
                    {item.description && (
                        <p className="font-mono text-sm text-gray-700 mb-4">
                            {item.description}
                        </p>
                    )}

                    {/* Video Container - Smaller size */}
                    <div className="max-w-2xl mx-auto">
                        <div className="relative bg-black border border-black">
                            <video
                                ref={videoRef}
                                className="w-full"
                                poster={item.thumbnail_url}
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={() => setIsPlaying(false)}
                                onClick={togglePlay}
                            >
                                <source src={item.file_url} type="video/mp4" />
                            </video>

                            {/* Custom Braun-inspired Controls */}
                            <div className="absolute bottom-0 left-0 right-0 bg-[#f5f1e8] border-t border-black">
                                {/* Progress Bar */}
                                <div
                                    className="h-1 bg-gray-300 cursor-pointer relative"
                                    onClick={handleProgressClick}
                                >
                                    <div
                                        className="h-full bg-black transition-all duration-100"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                {/* Control Buttons */}
                                <div className="flex items-center gap-3 px-3 py-2">
                                    {/* Play/Pause */}
                                    <button
                                        onClick={togglePlay}
                                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 transition-colors border border-black bg-white"
                                    >
                                        {isPlaying ? (
                                            <Pause
                                                className="w-4 h-4"
                                                strokeWidth={1.5}
                                            />
                                        ) : (
                                            <Play
                                                className="w-4 h-4 ml-0.5"
                                                strokeWidth={1.5}
                                            />
                                        )}
                                    </button>

                                    {/* Mute/Unmute */}
                                    <button
                                        onClick={toggleMute}
                                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 transition-colors border border-black bg-white"
                                    >
                                        {isMuted ? (
                                            <VolumeX
                                                className="w-4 h-4"
                                                strokeWidth={1.5}
                                            />
                                        ) : (
                                            <Volume2
                                                className="w-4 h-4"
                                                strokeWidth={1.5}
                                            />
                                        )}
                                    </button>

                                    {/* Spacer */}
                                    <div className="flex-1" />

                                    {/* Fullscreen */}
                                    <button
                                        onClick={toggleFullscreen}
                                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 transition-colors border border-black bg-white"
                                    >
                                        <Maximize
                                            className="w-4 h-4"
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {item.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="font-mono text-xs px-2 py-1 bg-gray-100 border border-gray-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ) : item.type === "poll" ? (
                <div className="mb-4 space-y-3">
                    {item.options.map((option, index) => {
                        const percentage = getVotePercentage(option);
                        const hasVoted =
                            votedOption !== null ||
                            option.votes?.includes(user?.email);

                        return (
                            <button
                                key={index}
                                onClick={() => handleVote(index)}
                                disabled={hasVoted}
                                className={`w-full text-left p-3 border border-black relative overflow-hidden transition-all ${
                                    hasVoted
                                        ? "cursor-default"
                                        : "hover:bg-gray-50"
                                }`}
                            >
                                <div
                                    className="absolute inset-0 bg-blue-100 transition-all duration-300"
                                    style={{
                                        width: hasVoted
                                            ? `${percentage}%`
                                            : "0%",
                                    }}
                                />
                                <div className="relative flex justify-between items-center">
                                    <span className="font-mono text-sm">
                                        {option.text}
                                    </span>
                                    {hasVoted && (
                                        <span className="font-heavy text-xs">
                                            {percentage}%
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                    <div className="flex items-center gap-2 text-gray-500 mt-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="font-mono text-xs">
                            {getTotalVotes()} total votes
                        </span>
                    </div>
                </div>
            ) : item.type === "image" ? (
                <div className="mb-4">
                    <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full border border-black mb-3"
                    />
                    {item.content && (
                        <p className="font-mono text-sm text-gray-700">
                            {item.content}
                        </p>
                    )}
                </div>
            ) : (
                <div className="mb-4">
                    <p className="font-mono text-sm text-gray-700 whitespace-pre-wrap">
                        {item.content}
                    </p>
                    {item.image_url && (
                        <img
                            src={item.image_url}
                            alt={item.title}
                            className="mt-4 w-full border border-black"
                        />
                    )}
                </div>
            )}

            {/* Comments Section */}
            <div className="border-t border-gray-300 pt-4">
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 font-heavy text-sm mb-4 hover:text-gray-600"
                >
                    <MessageSquare className="w-4 h-4" />
                    {comments.length}{" "}
                    {comments.length === 1 ? "comment" : "comments"}
                </button>

                {showComments && (
                    <div className="space-y-4">
                        {/* Existing Comments */}
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="bg-gray-50 p-3 border border-gray-300"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-heavy text-xs">
                                            {comment.user_name}
                                        </span>
                                        <span className="font-mono text-xs text-gray-500 ml-2">
                                            {format(
                                                new Date(comment.created_date),
                                                "MMM d, h:mm a"
                                            )}
                                        </span>
                                    </div>
                                    {(isAdmin ||
                                        comment.user_email === user?.email) && (
                                        <button
                                            onClick={() =>
                                                handleDeleteComment(comment.id)
                                            }
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <p className="font-mono text-sm">
                                    {comment.text}
                                </p>
                            </div>
                        ))}

                        {/* Add Comment Form */}
                        <form
                            onSubmit={handleSubmitComment}
                            className="flex gap-2"
                        >
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="add a comment..."
                                className="flex-1 font-mono text-sm border border-black rounded-none"
                                rows={2}
                            />
                            <Button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="bg-black text-white border border-black rounded-none font-heavy text-xs hover:bg-gray-800 disabled:bg-gray-400"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
