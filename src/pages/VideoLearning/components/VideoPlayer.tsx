import React from 'react';
import { Play, Rewind, FastForward, Volume2, Maximize, Pause, VolumeX } from 'lucide-react';
import { VideoInfo } from '../../../types';
import ReactPlayer from 'react-player';

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
  playbackRate = 1
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isYoutube = videoInfo.videoUrl.includes('youtube.com') || videoInfo.videoUrl.includes('youtu.be');

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !playerRef?.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    playerRef.current.seekTo(newTime, 'seconds');
  };

  return (
    <div className="relative w-full aspect-video bg-[#2A2A25] lg:rounded-[32px] overflow-hidden shadow-xl group shrink-0" id="video-container">
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
           }}
           onDuration={(d: number) => {
             if (setDuration && !isNaN(d)) {
               setDuration(d);
             }
           }}
           onReady={(player: any) => {
             if (setDuration && player && typeof player.getDuration === 'function') {
               const d = player.getDuration();
               if (d && !isNaN(d)) {
                 setDuration(d);
               }
             }
           }}
           onError={(e) => console.error("ReactPlayer Error:", e)}
           onPlay={() => setIsPlaying?.(true)}
           onPause={() => setIsPlaying?.(false)}
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

      {/* Top right gradient and Index */}
      <div className="absolute top-0 right-0 left-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-20" />
      <div className="absolute top-4 right-4 text-white font-medium drop-shadow-md text-sm md:text-base tracking-wider pointer-events-none z-20">
        {videoInfo.index} <span className="opacity-70 mx-0.5">/</span> {videoInfo.total}
      </div>

      {/* Custom Bottom Controls Overlay (Visible on hover/always on mobile sometimes) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col gap-2">
        {/* Progress Bar */}
        <div 
          className="w-full h-1.5 md:h-2 bg-white/30 rounded-full cursor-pointer relative"
          onClick={handleProgressClick}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-[#D48166] rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-3.5 md:h-3.5 bg-white rounded-full shadow"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between text-white mt-1 gap-2">
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
