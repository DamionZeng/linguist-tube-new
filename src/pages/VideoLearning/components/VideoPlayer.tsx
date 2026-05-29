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
    <div className="relative w-full aspect-video bg-[#2A2A25] lg:rounded-[32px] overflow-hidden shadow-xl group shrink-0">
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

    </div>
  );
};
