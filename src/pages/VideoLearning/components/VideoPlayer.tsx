import React, { useState, useRef, useEffect } from 'react';
import { Play, Rewind, FastForward, Volume2, Maximize, Pause, VolumeX, Loader2 } from 'lucide-react';
import { VideoInfo } from '../../../types';
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerProps {
  videoInfo: VideoInfo;
  playerRef?: any;
  isPlaying?: boolean;
  setIsPlaying?: (v: boolean) => void;
  currentTime?: number;
  setCurrentTime?: (t: number) => void;
  duration?: number;
  setDuration?: (d: number) => void;
  togglePlay?: () => void;
  step?: (amount: number) => void;
  toggleMute?: () => void;
  isMuted?: boolean;
  playbackRate?: number;
  isMaskActive?: boolean;
  buffered?: number;
  setBuffered?: (v: number) => void;
  isBuffering?: boolean;
  setIsBuffering?: (v: boolean) => void;
  activeIndex?: number;
  totalTranscripts?: number;
  onPlayerReady?: (player: any) => void;
  showVideoCaptions?: boolean;
  langMode?: 'bilingual' | 'en' | 'zh';
  activeTranscriptEn?: string;
  activeTranscriptZh?: string;
  isLooping?: boolean;
  onVideoEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoInfo, 
  playerRef,
  isPlaying, 
  setIsPlaying,
  currentTime = 0, 
  setCurrentTime,
  duration = 0, 
  setDuration,
  togglePlay, 
  step,
  toggleMute,
  isMuted,
  playbackRate = 1,
  isMaskActive,
  buffered = 0,
  setBuffered,
  isBuffering = false,
  setIsBuffering,
  activeIndex = 0,
  totalTranscripts = 0,
  onPlayerReady,
  showVideoCaptions = false,
  langMode = 'bilingual',
  activeTranscriptEn = '',
  activeTranscriptZh = '',
  isLooping = true,
  onVideoEnded
}) => {
  const [maskHeight, setMaskHeight] = useState(60);
  const [showControls, setShowControls] = useState(false);
  const [centerIcon, setCenterIcon] = useState<'play' | 'pause' | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    activeControls();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Single click logic: just activate controls (already handled by pointer down/move)
  };

  const handleOverlayDoubleClick = (e: React.MouseEvent) => {
    if (togglePlay) {
      togglePlay();
      const nextPlayingState = !isPlaying;
      setCenterIcon(nextPlayingState ? 'play' : 'pause');
      setTimeout(() => {
        setCenterIcon(null);
      }, 500); // hide icon after 500ms
    }
  };

  const handleMaskResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = maskHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      setMaskHeight(Math.max(30, startHeight - deltaY));
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
  const isYoutube = videoInfo.videoUrl.includes('youtube.com') || videoInfo.videoUrl.includes('youtu.be');

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !playerRef?.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    playerRef.current.seekTo(newTime, 'seconds');
  };

  return (
    <div 
      className="relative w-full aspect-video rounded-2xl lg:rounded-[32px] overflow-hidden shadow-xl shrink-0" 
      id="video-container"
      onMouseMove={activeControls}
      onPointerDown={handlePointerDown}
      onMouseLeave={() => {
        // Optionally hide immediately when mouse leaves, but 5s timeout handles it
      }}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
         <ReactPlayer
           ref={playerRef}
           url={videoInfo.videoUrl}
           width="100%"
           height="100%"
           playing={isPlaying}
           muted={isMuted}
           playbackRate={playbackRate}
           onProgress={(state: any) => {
             if (setCurrentTime && !isNaN(state.playedSeconds)) {
               setCurrentTime(state.playedSeconds);
             }
             if (setBuffered && !isNaN(state.loadedSeconds)) {
               setBuffered(state.loadedSeconds);
             }
           }}
           onBuffer={() => setIsBuffering?.(true)}
           onBufferEnd={() => setIsBuffering?.(false)}
           onDuration={(d: number) => {
             if (setDuration && !isNaN(d)) {
               setDuration(d);
             }
           }}
           onReady={(player: any) => {
             if (onPlayerReady) {
               onPlayerReady(player);
             }
             if (setDuration && player && typeof player.getDuration === 'function') {
               const d = player.getDuration();
               if (d && !isNaN(d)) {
                 setDuration(d);
               }
             }
           }}
           onPause={() => setIsPlaying?.(false)}
           onPlay={() => {
             setIsPlaying?.(true);
             setIsBuffering?.(false);
           }}
           onError={(e) => console.error("ReactPlayer Error:", e)}
           onEnded={() => {
             if (isLooping && playerRef?.current) {
               playerRef.current.seekTo(0, 'seconds');
               setIsPlaying?.(true);
             } else {
               setIsPlaying?.(false);
               onVideoEnded?.();
             }
           }}
           playsinline={true}
           controls={false}  // Hide native controls to use our custom ActionBar
           config={{
             file: {
               attributes: {
                 preload: 'auto' // Caching / Preload mechanism
               }
             },
             youtube: {
               playerVars: { 
                 disablekb: 1,
                 modestbranding: 1,
                 rel: 0,
                 controls: 0, // hide native youtube controls
                 iv_load_policy: 3
               }
             }
           }}
         />
      </div>

      {/* Click Overlay to catch double clicks on the video surface */}
      <div 
        className="absolute inset-0 z-10" 
        onClick={handleOverlayClick}
        onDoubleClick={handleOverlayDoubleClick}
      />

      {/* Video Captions Overlay */}
      {showVideoCaptions && (activeTranscriptEn || activeTranscriptZh) && (
        <div className="absolute bottom-0 left-0 right-0 z-25 flex flex-col items-center justify-end pb-1 px-4 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl px-5 py-1 max-w-[95%] w-full text-center">
            {(langMode === 'bilingual' || langMode === 'en') && activeTranscriptEn && (
              <p className="text-white text-[12px] font-bold leading-snug tracking-tight drop-shadow-md">{activeTranscriptEn}</p>
            )}
            {(langMode === 'bilingual' || langMode === 'zh') && activeTranscriptZh && (
              <p className="text-white/75 text-[10px] leading-snug mt-0.5 drop-shadow-md">{activeTranscriptZh}</p>
            )}
          </div>
        </div>
      )}

      {/* Center Action Icon Animation */}
      <AnimatePresence>
        {centerIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-35 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-6 text-white">
              {centerIcon === 'play' ? (
                <Play className="w-12 h-12 fill-current ml-1" />
              ) : (
                <Pause className="w-12 h-12 fill-current" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 z-35 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Top right gradient and Index (controlled by showControls) */}
      <div className={`transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-0 right-0 left-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-40" />
        <div className="absolute top-4 right-4 text-white font-medium drop-shadow-md text-sm md:text-base tracking-wider pointer-events-none z-40">
          {activeIndex !== -1 ? activeIndex + 1 : 0} <span className="opacity-70 mx-0.5">/</span> {totalTranscripts}
        </div>
      </div>

      {/* Subtitle Mask */}
      {isMaskActive && (
        <motion.div
          drag="y"
          dragConstraints={{ top: -300, bottom: 200 }}
          dragElastic={0}
          dragMomentum={false}
          className="absolute left-0 right-0 z-30 cursor-move shadow-[0_-4px_25px_rgba(0,0,0,0.5)] border-t border-white/10 backdrop-blur-md bg-black/40 overflow-visible"
          style={{ 
            height: `${maskHeight}px`, 
            bottom: 0, 
            touchAction: 'none' 
          }}
        >
          {/* Top Resize Handle */}
          <div 
            onPointerDown={handleMaskResize}
            className="absolute top-0 left-0 right-0 h-4 -mt-2 cursor-ns-resize flex items-center justify-center group z-40"
          >
            <div className="w-10 h-1 bg-white/20 group-hover:bg-white/60 rounded-full transition-colors" />
          </div>
        </motion.div>
      )}

      {/* Custom Bottom Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 z-40 flex flex-col gap-2 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Progress Bar */}
        <div 
          className="w-full h-1.5 md:h-2 bg-white/30 rounded-full cursor-pointer relative group/progress pointer-events-auto"
          onClick={handleProgressClick}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-white/20 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div 
            className="absolute top-0 left-0 h-full bg-[#D48166] rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-3.5 md:h-3.5 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between text-white mt-1 gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => step?.(-10)} className="hover:text-[#D48166] transition-colors p-1" title="-10s">
              <Rewind className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button onClick={togglePlay} className="hover:text-[#D48166] transition-colors p-1" title="Play/Pause">
              {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />}
            </button>
            <button onClick={() => step?.(10)} className="hover:text-[#D48166] transition-colors p-1" title="+10s">
              <FastForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="text-xs md:text-sm font-medium tracking-wide ml-2 opacity-90 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={toggleMute} className="hover:text-[#D48166] transition-colors p-1">
              {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <button 
              className="hover:text-[#D48166] transition-colors p-1" 
              onClick={() => {
                const el = document.getElementById('video-container');
                if (el) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    el.requestFullscreen();
                  }
                }
              }}
            >
              <Maximize className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

