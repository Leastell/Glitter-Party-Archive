import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// A simple, transparent, looping GIF of a drummer
const drummerGifUrl = "https://media.tenor.com/P0bT6s2nS-gAAAAi/drums-drum.gif";

export default function DrummerAnimation({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed bottom-4 right-4 z-50 pointer-events-none"
        >
          <div className="relative w-40 h-40 md:w-56 md:h-56">
            <img
              src={drummerGifUrl}
              alt="Drummer animation"
              className="w-full h-full object-contain"
              style={{
                // Apply filters to give it a vintage, 60s/70s lofi feel
                filter: 'sepia(0.4) saturate(0.8) contrast(1.2) brightness(0.9)',
                // This helps blend the animation with the background color
                mixBlendMode: 'multiply'
              }}
            />
            {/* This overlay helps tint the animation to match the page's aesthetic */}
            <div className="absolute inset-0 bg-[#fff8eb] mix-blend-color opacity-20"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}