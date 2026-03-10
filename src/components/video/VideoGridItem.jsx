import { useState } from "react";
import { Play, Download, Trash2 } from "lucide-react";

export default function VideoGridItem({ video, onDownload, onDelete, isAdmin }) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const handleVideoClick = () => {
    setVideoPlaying(!videoPlaying);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload(video);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(video);
  };

  // Determine aspect ratio class based on video orientation
  const aspectRatioClass = video.aspect_ratio === 'vertical' ? 'aspect-[9/16]' : 'aspect-video';

  return (
    <div 
      className="group relative bg-white border border-black cursor-pointer hover:shadow-lg transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleVideoClick}
    >
      {/* Video Player */}
      <div className={`relative ${aspectRatioClass} bg-black`}>
        <video
          className="w-full h-full object-cover"
          poster={video.thumbnail_url}
          controls={videoPlaying}
          muted
          onEnded={() => setVideoPlaying(false)}
        >
          <source src={video.file_url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Play Overlay */}
        {!videoPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <Play className="w-12 h-12 text-white fill-current opacity-80" />
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-3">
        <h3 className="font-heavy text-sm mb-1 line-clamp-2">{video.title}</h3>
        {video.description && (
          <p className="font-mono text-xs text-gray-600 line-clamp-2 mb-2">{video.description}</p>
        )}
        
        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="font-mono text-xs px-1 py-0.5 bg-gray-100 border border-gray-300">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Duration & Aspect Ratio */}
        <div className="flex justify-between items-center">
          {video.duration && (
            <p className="font-mono text-xs text-gray-500">
              {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
            </p>
          )}
          {video.aspect_ratio === 'vertical' && (
            <span className="font-mono text-xs text-gray-400">vertical</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          className={`w-8 h-8 flex items-center justify-center bg-white border border-black transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Download className="w-4 h-4 text-black" />
        </button>
        
        {/* Delete Button (Admin Only) */}
        {isAdmin && onDelete && (
          <button
            onClick={handleDelete}
            className={`w-8 h-8 flex items-center justify-center bg-red-600 border border-black text-white hover:bg-red-700 transition-all ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}