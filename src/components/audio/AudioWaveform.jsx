import React, { useRef, useEffect, useState, useCallback } from "react";

export default function AudioWaveform({ audioElement, isPlaying }) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw waveform bars
      const barWidth = (canvas.width / bufferLength) * 2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        // Create gradient effect
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  }, [isPlaying]);

  const initializeAudioContext = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        if (!sourceRef.current) {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }
      }
      setIsInitialized(true);
    } catch (error) {
      console.error("Error initializing audio context:", error);
    }
  }, [audioElement]);

  useEffect(() => {
    if (audioElement && isPlaying && !isInitialized) {
      initializeAudioContext();
    }
    
    if (isPlaying && isInitialized) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [audioElement, isPlaying, isInitialized, initializeAudioContext, startAnimation, stopAnimation]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={100}
      className={`absolute inset-0 w-full h-full transition-opacity duration-300 pointer-events-none ${
        isPlaying ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        background: 'transparent',
        mixBlendMode: 'multiply'
      }}
    />
  );
}