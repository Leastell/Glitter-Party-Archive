import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Download, Lock } from "lucide-react";
import AudioWaveform from "./AudioWaveform";
import { motion } from "framer-motion";

export default function AudioGridItem({ audioBreak, onDownload, isPlaying, onPlay, isLocked = false }) {
  const audioRef = useRef(null);

  const hasNewSticker = audioBreak.sticker === "new" || 
                        (audioBreak.title.toLowerCase().includes('the one') ||
                         audioBreak.title.toLowerCase().includes('everybody'));
  
  const hasHotSticker = audioBreak.sticker === "hot" || 
                        audioBreak.title.toLowerCase().includes('gadson break') ||
                        audioBreak.title.toLowerCase().includes('spector') ||
                        audioBreak.title.toLowerCase().includes('tambourine groove') ||
                        audioBreak.title.toLowerCase().includes('unstoppable') ||
                        audioBreak.title.toLowerCase().includes('homerz') ||
                        audioBreak.title.toLowerCase().includes('dripped');

  const hasLongSticker = audioBreak.sticker === "long" || 
                         audioBreak.title.toLowerCase().includes('no!');

  useEffect(() => {
    if (audioRef.current && !isLocked) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isPlaying, isLocked]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnd = () => onPlay(null);
    audio.addEventListener('ended', handleEnd);
    return () => {
      audio.removeEventListener('ended', handleEnd);
    };
  }, [onPlay]);

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.08 }
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.1 }
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className={`group relative aspect-square border border-black bg-white flex flex-col justify-between p-2 transition-colors duration-200 ease-in-out ${
        isLocked ? '' : 'hover:bg-gray-100 hover:shadow-lg'
      }`}
    >
      {!isLocked && <audio ref={audioRef} src={audioBreak.file_url} preload="metadata" crossOrigin="anonymous" />}

      {isPlaying && !isLocked && <AudioWaveform audioElement={audioRef.current} isPlaying={isPlaying} />}

      {/* Locked Overlay - only affects the content, not stickers */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
          <Lock className="w-8 h-8 text-white" />
        </div>
      )}

      {/* Stickers - positioned to overlap to the right */}
      {hasNewSticker && (
        <div className="absolute -top-3 -right-3 z-30 pointer-events-none">
          <div className="relative">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d594da8620fa76c929e50b/bde45fece_NewProject15.png"
              alt="New"
              className="w-12 h-12 transform rotate-12"
            />
            <div className="absolute inset-0 flex items-center justify-center transform rotate-12">
              <span className="font-heavy text-xs text-black">NEW</span>
            </div>
          </div>
        </div>
      )}

      {hasHotSticker && (
        <div className="absolute -top-3 -right-3 z-30 pointer-events-none">
          <div className="relative">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d594da8620fa76c929e50b/d1029323b_NewProject21.png"
              alt="Hot"
              className="w-12 h-12 transform rotate-12"
            />
            <div className="absolute inset-0 flex items-center justify-center transform rotate-12">
              <span className="font-heavy text-xs text-white">HOT</span>
            </div>
          </div>
        </div>
      )}

      {hasLongSticker && (
        <div className="absolute -top-3 -right-3 z-30 pointer-events-none">
          <div className="relative">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d594da8620fa76c929e50b/01f065303_NewProject22.png"
              alt="Long"
              className="w-12 h-12 transform rotate-12"
            />
            <div className="absolute inset-0 flex items-center justify-center transform rotate-12">
              <span className="font-heavy text-xs text-white">LONG</span>
            </div>
          </div>
        </div>
      )}

      {/* Content layer with reduced opacity when locked */}
      <div className={`relative z-10 flex flex-col justify-between h-full ${isLocked ? 'opacity-60' : ''}`}>
        {/* Top Section: Title */}
        <div className="text-left">
          <p
            className="font-heavy text-xs tracking-tight leading-tight"
            onDoubleClick={() => !isLocked && onPlay(isPlaying ? null : audioBreak.id)}
          >
            {audioBreak.title.toLowerCase()}
          </p>
        </div>

        {/* Center Section: Play/Pause Button */}
        {!isLocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={() => onPlay(isPlaying ? null : audioBreak.id)}
              className={`
                text-black relative pointer-events-auto
                transition-all duration-200 opacity-0 group-hover:opacity-100
                ${isPlaying ? 'opacity-100' : ''}
              `}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current" />
              )}
            </button>
          </div>
        )}

        {/* Bottom Section: Info & Download */}
        <div className="flex items-end justify-between">
          <div className="font-mono text-xs text-gray-700">
            <span>{audioBreak.decade}</span>
          </div>
          {!isLocked && (
            <button
              onClick={() => onDownload(audioBreak)}
              className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-transparent rounded"
            >
              <Download className="w-3 h-3 text-black" />
            </button>
          )}
        </div>
      </div>

      {/* Playing Indicator */}
      {isPlaying && !isLocked && <div className="absolute top-2 right-2 w-1 h-1 bg-red-500 rounded-full animate-ping z-30"></div>}
    </motion.div>
  );
}