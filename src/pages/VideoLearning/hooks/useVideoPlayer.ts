import { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Transcript } from '../../../types';

export const parseTime = (timeStr: string) => {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return 0;
};

export const useVideoPlayer = (transcripts: Transcript[] = []) => {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // Keep track of the current active transcript index
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const activeIndexRef = useRef<number>(-1);

  useEffect(() => {
    // Find active transcript index based on time
    let newIndex = -1;
    for (let i = 0; i < transcripts.length; i++) {
      const start = parseTime(transcripts[i].startTime);
      const end = parseTime(transcripts[i].endTime);
      if (currentTime >= start && currentTime < end) {
        newIndex = i;
        break;
      }
    }
    
    if (newIndex !== activeIndexRef.current) {
      if (newIndex !== -1) {
        activeIndexRef.current = newIndex;
        setActiveIndex(newIndex);
      } else if (activeIndexRef.current === -1 && transcripts.length > 0) {
         // If jumping to beginning before first subtitle, keep it 0 or -1? It displays as 0. 
         // That's fine.
      }
    }

    // Handle AB repeat loop
    if (isLooping && newIndex !== -1 && isPlaying) {
      const end = parseTime(transcripts[newIndex].endTime);
      // Give a tiny buffer (0.1s) to prevent jumping over
      if (currentTime >= end - 0.1) {
        const start = parseTime(transcripts[newIndex].startTime);
        if (playerRef.current) {
          playerRef.current.seekTo(start, 'seconds');
        }
      }
    }
  }, [currentTime, transcripts, isLooping, isPlaying]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const seek = useCallback((time: number) => {
    if (playerRef.current) playerRef.current.seekTo(time, 'seconds');
  }, []);

  const stepTranscript = useCallback((direction: 1 | -1) => {
    if (playerRef.current && transcripts.length > 0) {
      const ct = playerRef.current.getCurrentTime();
      let currentIndex = -1;
      
      // Find current transcript
      for (let i = 0; i < transcripts.length; i++) {
        const start = parseTime(transcripts[i].startTime);
        const end = parseTime(transcripts[i].endTime);
        if (ct >= start && ct <= end) { // Use <= to catch boundaries safely
          currentIndex = i;
          break;
        }
      }

      let targetIndex = currentIndex + direction;

      // If we are currently not inside a transcript, and going forward, find the NEXT transcript
      if (currentIndex === -1 && direction === 1) {
        for (let i = 0; i < transcripts.length; i++) {
          if (parseTime(transcripts[i].startTime) > ct) {
            targetIndex = i;
            break;
          }
        }
      }

      // If we are currently not inside a transcript, and going backward, find the PREV transcript
      if (currentIndex === -1 && direction === -1) {
        for (let i = transcripts.length - 1; i >= 0; i--) {
          if (parseTime(transcripts[i].endTime) < ct) {
            targetIndex = i;
            break;
          }
        }
      }

      // Clamp target index
      if (targetIndex < 0) targetIndex = 0;
      if (targetIndex >= transcripts.length) targetIndex = transcripts.length - 1;

      if (transcripts[targetIndex]) {
        const targetTime = parseTime(transcripts[targetIndex].startTime);
        playerRef.current.seekTo(targetTime, 'seconds');
        // Restart play if paused if desired, but user probably wants whatever state it was in
      }
    }
  }, [transcripts]);

  const step = useCallback((amount: number) => {
    if (playerRef.current) {
      const ct = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(ct + amount, 'seconds');
    }
  }, []);

  // When enabling repeat, jump to the start of current transcript immediately
  const toggleLooping = useCallback(() => {
    setIsLooping(prev => {
      const nextLooping = !prev;
      if (nextLooping && activeIndexRef.current !== -1 && playerRef.current) {
         const start = parseTime(transcripts[activeIndexRef.current].startTime);
         playerRef.current.seekTo(start, 'seconds');
      }
      return nextLooping;
    });
  }, [transcripts]);

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRate(prev => prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : prev === 1.5 ? 2 : 1);
  }, []);

  const repeatTranscript = useCallback(() => {
    if (playerRef.current && activeIndexRef.current !== -1 && transcripts[activeIndexRef.current]) {
      const start = parseTime(transcripts[activeIndexRef.current].startTime);
      playerRef.current.seekTo(start, 'seconds');
    }
  }, [transcripts]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    playerRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    playbackRate,
    isLooping,
    setIsLooping: toggleLooping,
    isMuted,
    buffered,
    setBuffered,
    isBuffering,
    setIsBuffering,
    togglePlay,
    seek,
    step,
    stepTranscript,
    repeatTranscript,
    cyclePlaybackRate,
    toggleMute,
    activeIndex
  };
};
