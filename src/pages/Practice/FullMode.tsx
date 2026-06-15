import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Volume2, Mic, Play, Loader2 } from 'lucide-react';
import { Header } from '../../components/Header';
import { useTranslation } from 'react-i18next';
import { fetchTranscripts, fetchVideoInfo, transcribeAudio } from '@api/index';
import { fetchVocabularyData } from '@api/general';
import { Transcript, VideoInfo } from '../../types';
import { useOriginalAudio } from '../../hooks/useOriginalAudio';
import { renderTimedWords, renderHighlightedText, TimedWord } from '../../utils/highlight';
import { compareSentence, SentenceScore } from '../../utils/scoring';
import { WordModal } from '../../components/WordModal';

function alignRecognizedToSentences(fullRecognized: string, sentences: Transcript[]): string[] {
  const recWords = fullRecognized
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z']/g, '').toLowerCase())
    .filter((w) => w.length > 0);

  const sentenceWordBounds: Array<{ start: number; end: number; text: string }> = [];
  let globalWordIdx = 0;
  for (const s of sentences) {
    const words = s.en
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z']/g, '').toLowerCase())
      .filter((w) => w.length > 0);
    if (words.length === 0) {
      sentenceWordBounds.push({ start: globalWordIdx, end: globalWordIdx, text: '' });
    } else {
      sentenceWordBounds.push({ start: globalWordIdx, end: globalWordIdx + words.length, text: s.en });
      globalWordIdx += words.length;
    }
  }

  return sentenceWordBounds.map(({ start, end }) => {
    const slice = recWords.slice(start, end);
    return slice.join(' ');
  });
}

export const FullMode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTime = location.state?.initialTime || 0;
  const { t } = useTranslation();

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'done'>('idle');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  const [liveRecognizedText, setLiveRecognizedText] = useState('');
  const [scores, setScores] = useState<Record<number, SentenceScore>>({});
  const [overallScore, setOverallScore] = useState(0);

  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  const segments = useMemo(
    () => transcripts.map((t) => ({ startTime: t.startTime, endTime: t.endTime })),
    [transcripts]
  );

  const videoUrl = videoInfo?.videoUrl || '';
  const {
    playFull,
    stop: stopOriginal,
    pause: pauseOriginal,
    isPlaying: isOriginalPlaying,
    playingSegmentIndex,
    currentTime: audioCurrentTime,
  } = useOriginalAudio({ videoUrl, segments, initialTime });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [transcriptsData, videoData, vocabData] = await Promise.all([
          fetchTranscripts(id),
          fetchVideoInfo(id),
          fetchVocabularyData()
        ]);
        setTranscripts(transcriptsData);
        setVideoInfo(videoData);
        setSavedWords(vocabData.map(v => v.word));
      } catch (err) {
        setError('Failed to load learning materials.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleWordClick = useCallback((word: string) => {
    setSelectedWord(word);
  }, []);

  useEffect(() => {
    if (playingSegmentIndex >= 0 && textContainerRef.current) {
      const children = textContainerRef.current.children;
      if (children[playingSegmentIndex]) {
        children[playingSegmentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playingSegmentIndex]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current = null;
      }
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    finalTranscriptRef.current = '';
    setLiveRecognizedText('');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + final).trim();
      }
      setLiveRecognizedText((finalTranscriptRef.current + ' ' + interim).trim());
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn('[SpeechRecognition] error:', event.error);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    console.log('[SpeechRecognition] started');
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    stopOriginal();

    setScores({});
    setOverallScore(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);

        if (recordingUrl) {
          URL.revokeObjectURL(recordingUrl);
        }

        setRecordingUrl(url);
        stream.getTracks().forEach((track) => track.stop());

        setStatus('processing');

        try {
          const recognized = await transcribeAudio(blob);
          console.log(`[ASR] full recognized length: ${recognized.length}`);

          if (recognized && transcripts.length > 0) {
            const aligned = alignRecognizedToSentences(recognized, transcripts);
            const newScores: Record<number, SentenceScore> = {};

            for (let i = 0; i < transcripts.length; i++) {
              const alignedText = aligned[i] || '';
              const originalText = transcripts[i].en;
              const result = compareSentence(originalText, alignedText);
              newScores[i] = result;
            }

            setScores(newScores);

            const scoredSentences = Object.values(newScores).filter(
              (s) => s.words.some((w) => w.status !== 'unrecognized')
            );
            const avg = scoredSentences.length > 0
              ? Math.round(scoredSentences.reduce((sum, s) => sum + s.score, 0) / scoredSentences.length)
              : 0;
            setOverallScore(avg);
          }
        } catch (err) {
          console.error('[ASR] transcription failed:', err);
        }

        setStatus('done');
      };

      setStatus('recording');
      mediaRecorder.start();
      startRecognition();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [recordingUrl, stopOriginal, transcripts, startRecognition]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopRecognition();
  }, [stopRecognition]);

  const playOriginal = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isOriginalPlaying) {
      pauseOriginal();
    } else {
      playFull();
    }
  }, [playFull, isOriginalPlaying, pauseOriginal]);

  const playRecording = useCallback(() => {
    if (!recordingUrl) return;

    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current = null;
    }

    const audio = new Audio(recordingUrl);
    audioPlaybackRef.current = audio;

    audio.onplay = () => setIsPlayingRecording(true);
    audio.onended = () => {
      setIsPlayingRecording(false);
      audioPlaybackRef.current = null;
    };
    audio.onerror = () => {
      setIsPlayingRecording(false);
      audioPlaybackRef.current = null;
    };

    audio.play().catch(() => setIsPlayingRecording(false));
  }, [recordingUrl]);

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

  return (
    <div className="w-full h-screen bg-[#F5F8FA] dark:bg-[#0B0E14] text-[#333] dark:text-[#F8FAFC] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans relative">
      <Header title={t('practice.fullMode')} onBack={() => navigate(`/video/${id}`)} />

      <main className="flex-1 overflow-y-auto py-6 px-4 md:px-8 custom-scrollbar">
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
          }
          @keyframes iconPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.8; }
          }
          .icon-pulse {
            animation: iconPulse 1s ease-in-out infinite;
          }
          @keyframes miniWave {
            0%, 100% { height: 6px; }
            50% { height: 18px; }
          }
          .mini-wave-bar {
            animation: miniWave 1s ease-in-out infinite;
            transform-origin: center;
          }
        `}</style>

        {status === 'processing' && (
          <div className="max-w-3xl mx-auto mb-6 flex items-center justify-center gap-3 p-4 bg-white dark:bg-[#151B25] rounded-2xl shadow-sm border border-[#E0E0E0] dark:border-[#1E293B]">
            <Loader2 className="w-5 h-5 text-[#D48166] animate-spin" />
            <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">
              {t('practice.scoring')}
            </span>
          </div>
        )}

        <div className="max-w-3xl mx-auto bg-white dark:bg-[#151B25] rounded-3xl p-6 md:p-10 shadow-sm border border-[#E0E0E0] dark:border-[#1E293B]">
          <div ref={textContainerRef} className="text-base md:text-lg font-serif text-[#333] dark:text-[#E2E8F0] leading-relaxed">
            {transcripts.map((sentence, idx) => {
              const isPlayingCurrent = playingSegmentIndex === idx;
              const sentenceScore = scores[idx];

              return (
                <span key={sentence.id} className="inline mr-1 transition-all duration-300">
                  <span 
                    className={isPlayingCurrent ? 'box-decoration-clone bg-[linear-gradient(transparent_65%,rgba(33,130,193,0.4)_65%)] bg-[length:100%_100%] bg-no-repeat' : ''}
                  >
                    {isOriginalPlaying && isPlayingCurrent && sentence.words?.en && sentence.words.en.length > 0
                      ? renderTimedWords(sentence.words.en as TimedWord[], audioCurrentTime, handleWordClick, savedWords, '#D48166', true)
                      : sentenceScore
                        ? (() => {
                            if (sentenceScore.words.length === 0) return sentence.en;
                            const rawTokens = sentence.en.split(/\s+/);
                            let scoreIdx = 0;
                            const tokenMapping = rawTokens.map((token) => {
                              const cleaned = token.replace(/[^a-zA-Z']/g, '');
                              if (cleaned.length > 0) return scoreIdx++;
                              return -1;
                            });
                            return rawTokens.map((token, ti) => (
                              <React.Fragment key={ti}>
                                {ti > 0 ? ' ' : ''}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cleaned = token.replace(/[^a-zA-Z']/g, '');
                                    if (cleaned) handleWordClick(cleaned);
                                  }}
                                  className={`cursor-pointer hover:bg-black/5 rounded-sm transition-colors duration-200 ${
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
                        : renderHighlightedText(sentence.en, [], handleWordClick, true, savedWords, '#2182c1')}
                  </span>
                  {sentenceScore && (
                    <span className={`inline-flex items-center justify-center ml-1 w-7 h-5 rounded-full text-[10px] font-bold align-middle ${
                      sentenceScore.score >= 80
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : sentenceScore.score >= 50
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {sentenceScore.score}
                    </span>
                  )}
                  <span className="ml-[1px]"></span>
                </span>
              );
            })}
          </div>
        </div>
      </main>

      <div className="shrink-0 p-6 bg-white dark:bg-[#151B25] border-t border-[#E0E0E0] dark:border-[#1E293B] flex flex-col items-center justify-center pb-safe z-20">
        {status === 'done' && overallScore > 0 && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#151B25] rounded-full shadow-sm border border-[#E0E0E0] dark:border-[#1E293B]">
            <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">{t('practice.performance')}:</span>
            <span className={`text-lg font-bold ${
              overallScore >= 80
                ? 'text-green-600 dark:text-green-400'
                : overallScore >= 50
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-500 dark:text-red-400'
            }`}>
              {overallScore}
            </span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center min-h-[80px] w-full">
          {status === 'idle' || status === 'done' ? (
            <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-6">
                <button
                  onClick={playOriginal}
                  disabled={!videoUrl}
                  className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ${
                    isOriginalPlaying
                      ? 'bg-[#D48166] text-white shadow-md'
                      : 'bg-[#E5E7EB] dark:bg-[#334155] text-[#9CA3AF] dark:text-[#CBD5E1]'
                  }`}
                >
                  <Volume2 className={`w-6 h-6 ${isOriginalPlaying ? 'icon-pulse' : ''}`} />
                </button>

                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-[#D48166] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all relative"
                >
                  <Mic className="w-8 h-8" />
                </button>

                {status === 'done' ? (
                  <button
                    onClick={playRecording}
                    disabled={isPlayingRecording}
                    className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ${
                      isPlayingRecording
                        ? 'bg-[#D48166] text-white'
                        : 'bg-[#E5E7EB] dark:bg-[#334155] text-[#9CA3AF] dark:text-[#CBD5E1]'
                    }`}
                  >
                    {isPlayingRecording ? (
                      <div className="flex items-center justify-center gap-1 w-full h-full">
                        <div className="w-1 bg-white rounded-full mini-wave-bar" style={{ animationDelay: '0s' }} />
                        <div className="w-1 bg-white rounded-full mini-wave-bar" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1 bg-white rounded-full mini-wave-bar" style={{ animationDelay: '0.4s' }} />
                      </div>
                    ) : (
                      <Play className="w-6 h-6 ml-1" />
                    )}
                  </button>
                ) : (
                  <div className="w-12 h-12" />
                )}
              </div>
              <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">
                {status === 'done' ? t('practice.rerecord') : t('practice.tapToRecord')}
              </span>
            </div>
          ) : status === 'recording' ? (
            <div className="flex flex-col items-center gap-3 w-full animate-in fade-in duration-300" onClick={stopRecording}>
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
              {liveRecognizedText && (
                <div className="max-w-md w-full max-h-20 overflow-y-auto text-center">
                  <p className="text-sm text-[#D48166] dark:text-[#D48166] font-medium leading-relaxed bg-[#D48166]/5 rounded-lg px-4 py-2">
                    {liveRecognizedText}
                  </p>
                </div>
              )}
              <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">
                {t('practice.tapToStop') || '点击结束录音'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
              <Loader2 className="w-8 h-8 text-[#D48166] animate-spin" />
              <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">
                {t('practice.scoring')}
              </span>
            </div>
          )}
        </div>
      </div>

      <WordModal 
        isOpen={!!selectedWord} 
        onClose={() => setSelectedWord(null)} 
        word={selectedWord || ''}
        savedWords={savedWords}
        onWordSaved={() => {
           fetchVocabularyData().then(vocab => setSavedWords(vocab.map(v => v.word)));
        }}
      />
    </div>
  );
};
