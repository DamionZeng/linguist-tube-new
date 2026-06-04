import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Volume2, Mic, Play, Check, Loader2 } from 'lucide-react';
import { Header } from '../../components/Header';
import { useTranslation } from 'react-i18next';
import { fetchTranscripts, fetchVideoInfo, transcribeAudio } from '@api/index';
import { Transcript, VideoInfo } from '../../types';
import { useOriginalAudio } from '../../hooks/useOriginalAudio';
import { renderTimedWordsUnderline, TimedWord } from '../../utils/highlight';
import { compareSentence, SentenceScore } from '../../utils/scoring';

interface CardState {
  status: 'idle' | 'recording' | 'scoring' | 'done';
  showTranslation: boolean;
}

interface RecordingData {
  blob: Blob;
  url: string;
}

export const SentenceMode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<number, CardState>>({});

  const [recordings, setRecordings] = useState<Record<number, RecordingData>>({});
  const [scores, setScores] = useState<Record<number, SentenceScore>>({});
  const [playingRecordingIdx, setPlayingRecordingIdx] = useState<number | null>(null);
  const [showFinishButton, setShowFinishButton] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIdxRef = useRef<number>(-1);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const recordingUrlsRef = useRef<string[]>([]);

  const segments = useMemo(
    () => transcripts.map((t) => ({ startTime: t.startTime, endTime: t.endTime })),
    [transcripts]
  );

  const videoUrl = videoInfo?.videoUrl || '';
  const {
    playSegment,
    stop: stopOriginal,
    isPlaying: isOriginalPlaying,
    playingSegmentIndex,
    currentTime: audioCurrentTime,
  } = useOriginalAudio({ videoUrl, segments });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [transcriptsData, videoData] = await Promise.all([
          fetchTranscripts(id),
          fetchVideoInfo(id),
        ]);
        setTranscripts(transcriptsData);
        setVideoInfo(videoData);

        const initialStates: Record<number, CardState> = {};
        transcriptsData.forEach((_, idx) => {
          initialStates[idx] = { status: 'idle', showTranslation: false };
        });
        setCardStates(initialStates);
      } catch (err) {
        setError('Failed to load learning materials.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    if (containerRef.current && transcripts.length > 0) {
      const activeElement = containerRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex, transcripts.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowFinishButton(true);
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [transcripts]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current = null;
      }
      recordingUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      recordingUrlsRef.current = [];
    };
  }, []);

  const toggleTranslation = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardStates((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], showTranslation: !prev[idx].showTranslation },
    }));
  }, []);

  const startRecording = useCallback(async (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();

    setScores((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });

    try {
      // Request microphone FIRST (before stopOriginal) to stay within
      // the user-gesture context. Mobile browsers require getUserMedia
      // to be called synchronously from a user click handler.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Now safe to stop any playing audio
      stopOriginal();
      // Determine best supported MIME type for MediaRecorder
      let mimeType = '';
      const mimeOptions = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      for (const mime of mimeOptions) {
        if (MediaRecorder.isTypeSupported(mime)) {
          mimeType = mime;
          break;
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      recordingIdxRef.current = idx;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);

        recordingUrlsRef.current.push(url);

        setRecordings((prev) => {
          if (prev[recordingIdxRef.current]?.url) {
            URL.revokeObjectURL(prev[recordingIdxRef.current].url);
            recordingUrlsRef.current = recordingUrlsRef.current.filter((u) => u !== prev[recordingIdxRef.current].url);
          }
          return {
            ...prev,
            [recordingIdxRef.current]: { blob, url },
          };
        });

        stream.getTracks().forEach((track) => track.stop());

        const recordedIdx = recordingIdxRef.current;
        const originalText = transcripts[recordedIdx]?.en || '';

        setCardStates((prev) => ({
          ...prev,
          [recordedIdx]: { ...prev[recordedIdx], status: 'scoring' },
        }));

        try {
          console.log('[ASR] uploading audio to backend...');
          const recognized = await transcribeAudio(blob);
          console.log(`[ASR] recognized="${recognized}", original="${originalText}"`);

          if (recognized) {
            const result = compareSentence(originalText, recognized);
            console.log(`[ASR] score=${result.score} matched=${result.words.filter(w => w.status === 'correct').length}/${result.words.filter(w => w.status !== 'unrecognized').length} total=${result.words.length}`);
            setScores((prev) => ({
              ...prev,
              [recordedIdx]: result,
            }));
          } else {
            console.warn('[ASR] no recognized text');
          }
        } catch (err) {
          console.error('[ASR] recognition failed:', err);
        }

        setCardStates((prev) => ({
          ...prev,
          [recordedIdx]: { ...prev[recordedIdx], status: 'done' },
        }));
      };

      setCardStates((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], status: 'recording' },
      }));

      mediaRecorder.start();
      console.log('[MediaRecorder] started');
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [transcripts, stopOriginal]);

  const stopRecording = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const playOriginal = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx < transcripts.length) {
      setActiveIndex(idx);
      playSegment(idx);
    }
  }, [playSegment, transcripts.length]);

  const playRecording = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();

    const recording = recordings[idx];
    if (!recording?.url) return;

    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current = null;
    }

    const audio = new Audio(recording.url);
    audioPlaybackRef.current = audio;

    audio.onplay = () => setPlayingRecordingIdx(idx);
    audio.onended = () => {
      setPlayingRecordingIdx(null);
      audioPlaybackRef.current = null;
    };
    audio.onerror = () => {
      setPlayingRecordingIdx(null);
      audioPlaybackRef.current = null;
    };

    audio.play().catch(() => setPlayingRecordingIdx(null));
  }, [recordings]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#F5F8FA] dark:bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D48166] animate-spin" />
      </div>
    );
  }

  if (error || transcripts.length === 0) {
    return (
      <div className="w-full h-screen bg-[#F5F8FA] dark:bg-[#0B0E14] flex flex-col items-center justify-center gap-4">
        <p className="text-[#666] dark:text-[#94A3B8]">{error || 'No transcripts available.'}</p>
        <button
          onClick={() => navigate(`/video/${id}`)}
          className="px-6 py-2 rounded-xl bg-[#D48166] text-white font-medium hover:bg-[#C27055] transition-colors"
        >
          {t('video.goBack')}
        </button>
      </div>
    );
  }

  const progressPct = transcripts.length > 0 ? ((activeIndex + 1) / transcripts.length) * 100 : 0;

  return (
    <div className="w-full h-screen bg-[#F5F8FA] dark:bg-[#0B0E14] text-[#333] dark:text-[#F8FAFC] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans relative">
      <Header title={t('practice.startReading') || '开始朗读'} onBack={() => navigate(`/video/${id!}`)} />

      <div className="shrink-0 px-4 md:px-8 pt-2 pb-1">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-[#E5E7EB] dark:bg-[#334155] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D48166] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-[#9CA3AF] dark:text-[#64748B] whitespace-nowrap tabular-nums">
            {activeIndex + 1} / {transcripts.length}
          </span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-32 pt-4 px-4 md:px-8 custom-scrollbar">
        <div ref={containerRef} className="max-w-2xl mx-auto flex flex-col gap-4">
          <style>{`
            @keyframes soundWave {
              0%, 100% { height: 8px; opacity: 0.6; }
              50% { height: 36px; opacity: 1; }
            }
            .sound-wave-bar {
              animation: soundWave 1.2s ease-in-out infinite;
              transform-origin: center;
            }
            @keyframes highlightPulse {
              0%, 100% { border-color: rgba(212,129,102,0.4); box-shadow: 0 0 0 0 rgba(212,129,102,0.2); }
              50% { border-color: rgba(212,129,102,0.8); box-shadow: 0 0 12px 2px rgba(212,129,102,0.15); }
            }
            .highlight-playing {
              animation: highlightPulse 1.5s ease-in-out infinite;
              border: 2px solid rgba(212,129,102,0.5);
            }
          `}</style>
          {transcripts.map((sentence, idx) => {
            const isActive = idx === activeIndex;
            const state = cardStates[idx] || { status: 'idle' as const, showTranslation: false };
            const hasRecording = !!recordings[idx];
            const isPlayingRecording = playingRecordingIdx === idx;
            const isPlayingOriginal = playingSegmentIndex === idx;
            const sentenceScore = scores[idx];

            return (
              <div
                key={sentence.id}
                onClick={() => !isActive && setActiveIndex(idx)}
                className={`transition-all duration-300 w-full bg-white dark:bg-[#151B25] rounded-3xl p-6 md:p-8 relative border-2 border-transparent
                  ${isActive ? 'opacity-100 shadow-md' : 'opacity-40 cursor-pointer hover:opacity-60'}
                  ${isPlayingOriginal ? 'highlight-playing' : ''}`}
              >
                <div className="text-xl md:text-2xl font-serif leading-relaxed mb-6">
                  {isPlayingOriginal && sentence.words?.en && sentence.words.en.length > 0
                    ? renderTimedWordsUnderline(sentence.words.en as TimedWord[], audioCurrentTime)
                    : sentenceScore
                      ? (() => {
                          if (sentenceScore.words.length === 0) return sentence.en;
                          const rawTokens = sentence.en.split(/\s+/);
                          let scoreIdx = 0;
                          const tokenMapping = rawTokens.map((token) => {
                            const cleaned = token.replace(/[^a-zA-Z']/g, '');
                            if (cleaned.length > 0) {
                              return scoreIdx++;
                            }
                            return -1;
                          });
                          return rawTokens.map((token, ti) => (
                            <React.Fragment key={ti}>
                              {ti > 0 ? ' ' : ''}
                              <span
                                className={`transition-colors duration-300 ${
                                  (() => {
                                    const wi = tokenMapping[ti];
                                    if (wi === -1) return '';
                                    const s = sentenceScore.words[wi];
                                    if (!s) return '';
                                    if (s.status === 'correct') return 'text-green-600 dark:text-green-400 font-semibold';
                                    if (s.status === 'incorrect') return 'text-red-500 dark:text-red-400 font-semibold';
                                    return '';
                                  })()
                                }`}
                              >
                                {token}
                              </span>
                            </React.Fragment>
                          ));
                        })()
                      : sentence.en
                  }
                  {sentenceScore && (
                    <span className={`inline-flex items-center justify-center ml-3 w-10 h-7 rounded-full text-xs font-bold align-middle ${
                      sentenceScore.score >= 80
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : sentenceScore.score >= 50
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {sentenceScore.score}
                    </span>
                  )}
                </div>

                <div
                  onClick={(e) => toggleTranslation(idx, e)}
                  className={`mt-4 text-base md:text-lg text-[#666] dark:text-[#94A3B8] transition-all duration-300 cursor-pointer rounded-lg p-2 -mx-2
                    ${state.showTranslation ? 'filter-none bg-[#F5F8FA] dark:bg-[#1C222C]' : 'blur-sm select-none hover:bg-[#F5F8FA]/50 dark:hover:bg-[#1C222C]/50'}`}
                  title={state.showTranslation ? t('practice.hideTranslation') : t('practice.showTranslation')}
                >
                  {sentence.zh}
                </div>

                {isActive && (
                  <div className="mt-8 flex flex-col items-center justify-center min-h-[100px]">
                    {state.status === 'scoring' ? (
                      <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <Loader2 className="w-8 h-8 text-[#D48166] animate-spin" />
                        <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">
                          {t('practice.scoring') || '正在评分…'}
                        </span>
                      </div>
                    ) : state.status !== 'recording' ? (
                      <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-6">
                          <button
                            onClick={(e) => playOriginal(idx, e)}
                            disabled={!videoUrl || isOriginalPlaying}
                            className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ${
                              isPlayingOriginal
                                ? 'bg-[#D48166] text-white shadow-md'
                                : 'bg-[#E5E7EB] dark:bg-[#334155] text-[#9CA3AF] dark:text-[#CBD5E1]'
                            }`}
                          >
                            <Volume2 className="w-6 h-6" />
                          </button>

                          <button
                            onClick={(e) => startRecording(idx, e)}
                            className="w-16 h-16 rounded-full bg-[#D48166] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all relative"
                          >
                            <Mic className="w-8 h-8" />
                          </button>

                          {hasRecording ? (
                            <button
                              onClick={(e) => playRecording(idx, e)}
                              disabled={isPlayingRecording}
                              className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ${
                                isPlayingRecording
                                  ? 'bg-[#D48166] text-white'
                                  : 'bg-[#E5E7EB] dark:bg-[#334155] text-[#9CA3AF] dark:text-[#CBD5E1]'
                              }`}
                            >
                              <Play className="w-6 h-6 ml-1" />
                            </button>
                          ) : (
                            <div className="w-12 h-12" />
                          )}
                        </div>
                        <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">
                          {hasRecording ? t('practice.rerecord') : t('practice.tapToRecord')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 w-full animate-in fade-in duration-300" onClick={(e) => stopRecording(idx, e)}>
                        <div className="flex items-center justify-center gap-1.5 h-12 my-2 cursor-pointer">
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-[#D48166] rounded-full sound-wave-bar"
                              style={{
                                animationDelay: `${i * 0.15 - Math.random() * 0.5}s`,
                                animationDuration: `${0.8 + Math.random() * 0.4}s`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">
                          {t('practice.tapToStop')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {hasRecording && (
                  <div className="absolute bottom-4 right-4 text-[#D48166] bg-[#FCF5F3] dark:bg-[#1E293B] rounded-full p-1 animate-in zoom-in">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={sentinelRef} className="h-1 w-full shrink-0" />
        </div>
      </main>

      {showFinishButton && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F5F8FA] via-[#F5F8FA] dark:from-[#0B0E14] dark:via-[#0B0E14] to-transparent shrink-0 flex justify-center pb-safe animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => navigate(`/practice/result/${id!}`)}
            className="w-[200px] h-14 rounded-full bg-[#D48166] text-white font-bold text-lg shadow-[0_4px_14px_rgba(212,129,102,0.4)] hover:bg-[#C27055] transition-colors active:scale-95"
          >
            {t('practice.finish')}
          </button>
        </div>
      )}
    </div>
  );
};
