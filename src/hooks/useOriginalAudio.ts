import { useRef, useState, useCallback, useEffect } from 'react';
import { parseTime } from '../utils/time';

interface Segment {
  startTime: string;
  endTime: string;
}

interface UseOriginalAudioOptions {
  videoUrl: string;
  segments: Segment[];
}

interface UseOriginalAudioReturn {
  playSegment: (index: number) => void;
  playFull: () => void;
  stop: () => void;
  isPlaying: boolean;
  playingSegmentIndex: number;
  currentTime: number;
}

function findSegmentIndex(segments: Segment[], currentSeconds: number): number {
  for (let i = 0; i < segments.length; i++) {
    const start = parseTime(segments[i].startTime);
    const end = parseTime(segments[i].endTime);
    if (currentSeconds >= start && currentSeconds < end) {
      return i;
    }
  }
  return -1;
}

export function useOriginalAudio({ videoUrl, segments }: UseOriginalAudioOptions): UseOriginalAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSegmentIndex, setPlayingSegmentIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeUpdateRef = useRef<number | null>(null);
  const playSegmentIndexRef = useRef<number>(-1);

  useEffect(() => {
    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
    };
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(videoUrl);
      audioRef.current.preload = 'auto';
    }
    if (audioRef.current.src !== videoUrl && videoUrl) {
      audioRef.current.src = videoUrl;
    }
    return audioRef.current;
  }, [videoUrl]);

  const stop = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (timeUpdateRef.current) {
      cancelAnimationFrame(timeUpdateRef.current);
      timeUpdateRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPlayingSegmentIndex(-1);
    setCurrentTime(0);
    playSegmentIndexRef.current = -1;
  }, []);

  const startTimeUpdateLoop = useCallback(() => {
    const loop = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) {
        timeUpdateRef.current = null;
        return;
      }

      const ct = audio.currentTime;
      setCurrentTime(ct);

      if (playSegmentIndexRef.current >= 0) {
        timeUpdateRef.current = requestAnimationFrame(loop);
        return;
      }

      const idx = findSegmentIndex(segments, ct);
      if (idx !== playingSegmentIndex) {
        setPlayingSegmentIndex(idx);
      }

      timeUpdateRef.current = requestAnimationFrame(loop);
    };
    timeUpdateRef.current = requestAnimationFrame(loop);
  }, [segments, playingSegmentIndex]);

  const playSegment = useCallback(
    (index: number) => {
      if (index < 0 || index >= segments.length) return;
      stop();

      const audio = ensureAudio();
      const seg = segments[index];
      const startSec = parseTime(seg.startTime);
      const endSec = parseTime(seg.endTime);
      const duration = endSec - startSec;

      if (duration <= 0) return;

      audio.currentTime = startSec;
      setIsPlaying(true);
      setPlayingSegmentIndex(index);
      setCurrentTime(startSec);
      playSegmentIndexRef.current = index;

      const handleCanPlay = () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.play().catch(() => {
          setIsPlaying(false);
          setPlayingSegmentIndex(-1);
          playSegmentIndexRef.current = -1;
        });

        startTimeUpdateLoop();

        stopTimerRef.current = setTimeout(() => {
          audio.pause();
          setIsPlaying(false);
          setPlayingSegmentIndex(-1);
          playSegmentIndexRef.current = -1;
        }, duration * 1000);
      };

      const handleError = () => {
        audio.removeEventListener('error', handleError);
        setIsPlaying(false);
        setPlayingSegmentIndex(-1);
        playSegmentIndexRef.current = -1;
      };

      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
    },
    [stop, ensureAudio, segments, startTimeUpdateLoop]
  );

  const playFull = useCallback(() => {
    stop();

    const audio = ensureAudio();
    audio.currentTime = 0;
    setIsPlaying(true);
    setCurrentTime(0);
    playSegmentIndexRef.current = -1;
    startTimeUpdateLoop();

    const handleCanPlay = () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.play().catch(() => setIsPlaying(false));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlayingSegmentIndex(-1);
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
        timeUpdateRef.current = null;
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleEnded);
  }, [stop, ensureAudio, startTimeUpdateLoop]);

  return {
    playSegment,
    playFull,
    stop,
    isPlaying,
    playingSegmentIndex,
    currentTime,
  };
}
