import { useRef, useState, useCallback, useEffect } from 'react';
import { parseTime } from '../utils/time';

interface Segment {
  startTime: string;
  endTime: string;
}

interface UseOriginalAudioOptions {
  videoUrl: string;
  segments: Segment[];
  initialTime?: number;
}

interface UseOriginalAudioReturn {
  playSegment: (index: number) => void;
  playFull: () => void;
  stop: () => void;
  pause: () => void;
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

export function useOriginalAudio({ videoUrl, segments, initialTime = 0 }: UseOriginalAudioOptions): UseOriginalAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSegmentIndex, setPlayingSegmentIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const initialSeekDoneRef = useRef(false);
  const timeUpdateRef = useRef<number | null>(null);
  const playSegmentIndexRef = useRef<number>(-1);
  const endSecRef = useRef<number>(-1);
  const cleanupRef = useRef<(() => void) | null>(null);
  // Track whether the audio element has enough data buffered to seek reliably
  const readyRef = useRef(false);

  // Preload audio and wait until enough data is buffered for reliable seeking.
  // On mobile Edge, merely having "loadedmetadata" is not sufficient —
  // the browser needs buffered audio data at the seek target, otherwise
  // setting currentTime is silently ignored and "seeked" never fires.
  useEffect(() => {
    if (!videoUrl) return;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = videoUrl;
    readyRef.current = false;

    const onCanPlay = () => {
      audioRef.current = audio;
      readyRef.current = true;
      audio.removeEventListener('canplay', onCanPlay);
    };

    // canplay fires when enough data is available to play without buffering.
    // This is more reliable than loadedmetadata for mobile browsers.
    audio.addEventListener('canplay', onCanPlay);

    // Also set audioRef immediately on loadedmetadata as a fallback,
    // but don't mark as ready yet — seeking may still fail.
    const onMeta = () => {
      if (!audioRef.current) {
        audioRef.current = audio;
      }
      audio.removeEventListener('loadedmetadata', onMeta);
    };
    audio.addEventListener('loadedmetadata', onMeta);

    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.pause();
      audio.src = '';
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      readyRef.current = false;
    };
  }, [videoUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
        timeUpdateRef.current = null;
      }
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    // Cleanup any pending play operation's listeners
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (timeUpdateRef.current) {
      cancelAnimationFrame(timeUpdateRef.current);
      timeUpdateRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        // Ignore errors from pause() — it can throw if audio is in an invalid state
      }
    }
    setIsPlaying(false);
    setPlayingSegmentIndex(-1);
    setCurrentTime(0);
    playSegmentIndexRef.current = -1;
    endSecRef.current = -1;
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }
    setIsPlaying(false);
    if (timeUpdateRef.current) {
      cancelAnimationFrame(timeUpdateRef.current);
      timeUpdateRef.current = null;
    }
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

      if (playSegmentIndexRef.current >= 0 && endSecRef.current > 0 && ct >= endSecRef.current) {
        audio.pause();
        setIsPlaying(false);
        setPlayingSegmentIndex(-1);
        playSegmentIndexRef.current = -1;
        endSecRef.current = -1;
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
      const audio = audioRef.current;
      if (!audio) return;

      // Resume if we are already playing or paused on this segment
      if (playSegmentIndexRef.current === index && audio.paused) {
        setIsPlaying(true);
        audio.play().catch(() => setIsPlaying(false));
        startTimeUpdateLoop();
        return;
      }

      stop();

      const seg = segments[index];
      const startSec = parseTime(seg.startTime);
      const endSec = parseTime(seg.endTime);
      const duration = endSec - startSec;

      if (duration <= 0) return;

      if (!audio) {
        setIsPlaying(false);
        return;
      }

      let played = false;

      const cleanup = () => {
        audio.removeEventListener('seeked', onSeeked);
        audio.removeEventListener('canplay', onCanPlayRetry);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('ended', onEnded);
        if (cleanupRef.current === cleanup) {
          cleanupRef.current = null;
        }
      };

      // Register cleanup so stop() can cancel this play operation
      cleanupRef.current = cleanup;

      const fail = () => {
        if (played) return;
        played = true;
        cleanup();
        setIsPlaying(false);
        setPlayingSegmentIndex(-1);
        playSegmentIndexRef.current = -1;
        endSecRef.current = -1;
      };

      const doPlay = () => {
        if (played) return;
        played = true;
        cleanup();
        setIsPlaying(true);
        setPlayingSegmentIndex(index);
        setCurrentTime(startSec);
        playSegmentIndexRef.current = index;
        endSecRef.current = endSec;
        audio.play().catch(fail);
        startTimeUpdateLoop();
      };

      const onSeeked = () => {
        if (played) return;
        audio.removeEventListener('seeked', onSeeked);
        doPlay();
      };

      // Fallback: if audio isn't ready yet (canplay hasn't fired),
      // wait for canplay then retry the seek + play sequence.
      const onCanPlayRetry = () => {
        if (played) return;
        readyRef.current = true;
        // Try seeking again now that data is buffered
        audio.currentTime = startSec;
        // Check if seek was synchronous
        if (Math.abs(audio.currentTime - startSec) < 0.1) {
          audio.removeEventListener('seeked', onSeeked);
          doPlay();
        }
        // Otherwise onSeeked will handle it
      };

      const onError = () => {
        cleanup();
        fail();
      };

      const onEnded = () => {
        cleanup();
        setIsPlaying(false);
        setPlayingSegmentIndex(-1);
        playSegmentIndexRef.current = -1;
        endSecRef.current = -1;
        if (timeUpdateRef.current) {
          cancelAnimationFrame(timeUpdateRef.current);
          timeUpdateRef.current = null;
        }
      };

      audio.addEventListener('seeked', onSeeked);
      audio.addEventListener('error', onError);
      audio.addEventListener('ended', onEnded);

      // If audio isn't ready yet (mobile Edge first load), add canplay listener
      // as a fallback to retry seeking once data is buffered
      if (!readyRef.current) {
        audio.addEventListener('canplay', onCanPlayRetry);
      }

      // Set currentTime to seek to the segment start
      audio.currentTime = startSec;

      // If already at target position (browser handled seek synchronously), play now.
      if (Math.abs(audio.currentTime - startSec) < 0.1) {
        audio.removeEventListener('seeked', onSeeked);
        if (!readyRef.current) {
          audio.removeEventListener('canplay', onCanPlayRetry);
        }
        doPlay();
      }
    },
    [stop, segments, startTimeUpdateLoop]
  );

  const playFull = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playSegmentIndexRef.current === -2 && audio.paused) {
      setIsPlaying(true);
      audio.play().catch(() => setIsPlaying(false));
      startTimeUpdateLoop();
      return;
    }

    stop();

    let played = false;

    const cleanup = () => {
      audio.removeEventListener('seeked', onSeeked);
      audio.removeEventListener('canplay', onCanPlayRetry);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onEnded);
      if (cleanupRef.current === cleanup) {
        cleanupRef.current = null;
      }
    };

    cleanupRef.current = cleanup;

    const onSeeked = () => {
      if (played) return;
      audio.removeEventListener('seeked', onSeeked);
      cleanup();
      played = true;
      setIsPlaying(true);
      setCurrentTime(audio.currentTime);
      playSegmentIndexRef.current = -2;
      endSecRef.current = -1;
      audio.play().catch(() => setIsPlaying(false));
      startTimeUpdateLoop();
    };

    const onCanPlayRetry = () => {
      if (played) return;
      readyRef.current = true;
      // Seek to current time (which might be initialTime) if it's not already there
      const targetTime = audio.currentTime;
      audio.currentTime = targetTime;
      if (Math.abs(audio.currentTime - targetTime) < 0.1) {
        audio.removeEventListener('seeked', onSeeked);
        cleanup();
        played = true;
        setIsPlaying(true);
        setCurrentTime(audio.currentTime);
        playSegmentIndexRef.current = -2;
        endSecRef.current = -1;
        audio.play().catch(() => setIsPlaying(false));
        startTimeUpdateLoop();
      }
    };

    const onEnded = () => {
      cleanup();
      setIsPlaying(false);
      setPlayingSegmentIndex(-1);
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
        timeUpdateRef.current = null;
      }
    };

    audio.addEventListener('seeked', onSeeked);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onEnded);

    if (!readyRef.current) {
      audio.addEventListener('canplay', onCanPlayRetry);
    }

    const startTarget = audio.currentTime > 0 ? audio.currentTime : currentTime;
    audio.currentTime = startTarget;

    if (Math.abs(audio.currentTime - startTarget) < 0.1) {
      audio.removeEventListener('seeked', onSeeked);
      if (!readyRef.current) {
        audio.removeEventListener('canplay', onCanPlayRetry);
      }
      cleanup();
      played = true;
      setIsPlaying(true);
      setCurrentTime(audio.currentTime);
      playSegmentIndexRef.current = -2;
      endSecRef.current = -1;
      audio.play().catch(() => setIsPlaying(false));
      startTimeUpdateLoop();
    }
  }, [stop, startTimeUpdateLoop]);

  return {
    playSegment,
    playFull,
    stop,
    pause,
    isPlaying,
    playingSegmentIndex,
    currentTime,
  };
}
