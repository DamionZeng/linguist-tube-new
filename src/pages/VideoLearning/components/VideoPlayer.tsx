import React from 'react';
import { Play, Rewind, FastForward, Volume2, Maximize, Pause, VolumeX } from 'lucide-react';
import { VideoInfo } from '../../../types';

interface VideoPlayerProps {
  videoInfo: VideoInfo;
  videoRef?: React.RefObject<HTMLVideoElement>;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  togglePlay?: () => void;
  step?: (amount: number) => void;
  toggleMute?: () => void;
  isMuted?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoInfo, 
  videoRef, 
  isPlaying, 
  currentTime = 0, 
  duration = 0, 
  togglePlay, 
  step,
  toggleMute,
  isMuted 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef?.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  return (
    <div className="relative w-full aspect-video bg-[#2A2A25] lg:rounded-[32px] overflow-hidden shadow-xl group shrink-0">
      <video
        ref={videoRef}
        src={videoInfo.videoUrl}
        poster={videoInfo.thumbnail}
        className="w-full h-full object-cover"
        playsInline
        onClick={togglePlay}
      />
      {/* Top right gradient and Index */}
      <div className="absolute top-0 right-0 left-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute top-4 right-4 text-white font-medium drop-shadow-md text-sm md:text-base tracking-wider pointer-events-none">
        {videoInfo.index} <span className="opacity-70 mx-0.5">/</span> {videoInfo.total}
      </div>

      {/* Bottom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-3 px-4 flex flex-col gap-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Progress Bar */}
        <div 
           className="w-full h-1.5 bg-white/20 relative cursor-pointer group/progress"
           onClick={handleProgressClick}
        >
          <div className="absolute top-0 left-0 h-full bg-[#D48166] transition-all" style={{ width: `${progress}%` }} />
          <div 
             className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md shadow-black/50 opacity-100 lg:opacity-0 group-hover/progress:opacity-100 transition-opacity" 
             style={{ left: `calc(${progress}% - 7px)` }} 
          />
        </div>
        
        {/* Control Buttons */}
        <div className="flex flex-row items-center justify-between text-white pb-1">
          <div className="flex items-center gap-5">
             <button onClick={(e) => { e.stopPropagation(); step?.(-10); }} className="hover:text-[#D48166] transition-colors drop-shadow-md">
               <Rewind className="w-5 h-5 fill-current" />
             </button>
             <button onClick={(e) => { e.stopPropagation(); togglePlay?.(); }} className="hover:text-[#D48166] transition-colors drop-shadow-md">
               {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
             </button>
             <button onClick={(e) => { e.stopPropagation(); step?.(10); }} className="hover:text-[#D48166] transition-colors drop-shadow-md">
               <FastForward className="w-5 h-5 fill-current" />
             </button>
             <div className="hidden sm:block text-xs font-mono font-medium ml-3 tracking-wider drop-shadow-md">
               <span>{formatTime(currentTime)}</span>
               <span className="text-white/50 mx-1.5">/</span>
               <span className="text-white/80">{formatTime(duration || 0)}</span>
             </div>
          </div>

          <div className="flex items-center gap-5">
             <button onClick={(e) => { e.stopPropagation(); toggleMute?.(); }} className="hover:text-[#D48166] transition-colors drop-shadow-md">
               {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
             </button>
             <button className="hover:text-[#D48166] transition-colors drop-shadow-md">
               <Maximize className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
