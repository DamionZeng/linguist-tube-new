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
  const endSecRef = useRef<number>(-1);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Lazy-create Audio element on demand.
  // IMPORTANT: Do NOT preload on mount — on mobile browsers, a preloaded
  // Audio element with preload='auto' holds a lock on the audio hardware
  // channel, which silently blocks getUserMedia({audio:true}) for recording.
  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
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
    endSecRef.current = -1;
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

      // If playing a specific segment, check if we've reached the end
      if (playSegmentIndexRef.current >= 0 && endSecRef.current > 0 && ct >= endSecRef.current) {
        audio.pause();
        setIsPlaying(false);
        setPlayingSegmentIndex(-1);
        playSegmentIndexRef.current = -1;
        endSecRef.current = -1;
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
          stopTimerRef.current = null;
        }
        timeUpdateRef.current = null;
        return;
      }

      if (playSegmentIndexRef.current < 0) {
        const idx = findSegmentIndex(segments, ct);
        if (idx !== playingSegmentIndex) {
          setPlayingSegmentIndex(idx);
        }
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

      // Set currentTime BEFORE waiting for canplay.
      // On desktop browsers with cached data, this works immediately.
      // On mobile Edge, the seek may be deferred until data is buffered,
      // so we use the seeked event as the reliable signal to start playback.
      audio.currentTime = startSec;

      // Use seeked event as the primary trigger — this is the most reliable
      // signal across all browsers that the audio has seeked to the target position.
      // On mobile Edge's first click, loadedmetadata fires but seeking may be
      // deferred; seeked fires once the browser actually moves to the target time.
      let started = false;

      const startPlayback = () => {
        if (started) return;
        started = true;
        cleanup();
        setIsPlaying(true);
        setPlayingSegmentIndex(index);
        setCurrentTime(startSec);
        playSegmentIndexRef.current = index;
        endSecRef.current = endSec;
        audio.play().catch(() => {
          setIsPlaying(false);
          setPlayingSegmentIndex(-1);
          playSegmentIndexRef.current = -1;
          endSecRef.current = -1;
        });
        startTimeUpdateLoop();

        // Safety timer: stop after segment duration in case timeupdate misses
        stopTimerRef.current = setTimeout(() => {
          audio.pause();
          setIsPlaying(false);
          setPlayingSegmentIndex(-1);
          playSegmentIndexRef.current = -1;
          endSecRef.current = -1;
        }, duration * 1000 + 200);
      };

      const onSeeked = () => {
        audio.removeEventListener('seeked', onSeeked);
        startPlayback();
      };

      const onCanPlay = () => {
        // canplay fires when enough data is buffered to play.
        // Re-attempt the seek now that data is available.
        audio.currentTime = startSec;
        // If the seek was synchronous (already at target), play immediately.
        // Otherwise, onSeeked will handle it.
        if (Math.abs(audio.currentTime - startSec) < 0.1) {
          audio.removeEventListener('seeked', onSeeked);
          startPlayback();
        }
      };

      const onError = () => {
        cleanup();
        setIsPlaying(false);
        setPlayingSegmentIndex(-1);
        playSegmentIndexRef.current = -1;
        endSecRef.current = -1;
      };

      const cleanup = () => {
        audio.removeEventListener('seeked', onSeeked);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
      };

      audio.addEventListener('seeked', onSeeked);
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error', onError);

      // If the browser already has the data and seeked synchronously, play now.
      if (Math.abs(audio.currentTime - startSec) < 0.1) {
        audio.removeEventListener('seeked', onSeeked);
        startPlayback();
      }
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
    endSecRef.current = -1;
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
