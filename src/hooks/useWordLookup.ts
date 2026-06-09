import { useState, useEffect, useCallback } from 'react';
import { fetchWordLookup, addVocabularyWord, addFavoriteSentence } from '@api/general';
import { getBaseWord, getBasePhrase } from '../utils/lemmatize';
import type { WordLookupData } from '../types/word';

// ======== 模块级缓存：跨组件挂载/卸载保持 ========
const wordDataCache = new Map<string, WordLookupData>();
const pendingFetches = new Map<string, Promise<WordLookupData | null>>();

/**
 * 静默预加载单词数据到缓存（不触发任何 UI 状态变化）
 * 如果已有缓存或正在加载，则跳过
 */
export async function prefetchWord(word: string): Promise<void> {
  const isPhrase = word.includes(' ');
  const baseWord = isPhrase ? getBasePhrase(word) : getBaseWord(word);
  if (!baseWord || wordDataCache.has(baseWord) || pendingFetches.has(baseWord)) return;

  const promise = fetchWordLookup(baseWord)
    .then((data) => {
      wordDataCache.set(baseWord, data);
      pendingFetches.delete(baseWord);
      return data;
    })
    .catch(() => {
      pendingFetches.delete(baseWord);
      return null;
    });

  pendingFetches.set(baseWord, promise);
  try {
    await promise;
  } catch {
    // silent
  }
}

/**
 * 从缓存中获取单词数据（同步，无副作用）
 */
export function getCachedWordData(word: string): WordLookupData | undefined {
  const isPhrase = word.includes(' ');
  const baseWord = isPhrase ? getBasePhrase(word) : getBaseWord(word);
  return baseWord ? wordDataCache.get(baseWord) : undefined;
}

interface UseWordLookupOptions {
  word: string;
  enabled?: boolean;
  savedWords?: string[];
  savedPhrases?: string[];
  onWordSaved?: (word: string) => void;
}

export function useWordLookup({ word, enabled = true, savedWords = [], savedPhrases = [], onWordSaved }: UseWordLookupOptions) {
  // 初始化时先检查缓存，有缓存则直接从缓存恢复，避免 loading 闪烁
  const isPhraseInit = enabled && word.includes(' ');
  const baseWord = enabled && word ? (isPhraseInit ? getBasePhrase(word) : getBaseWord(word)) : '';
  const cached = baseWord ? wordDataCache.get(baseWord) : undefined;

  const [details, setDetails] = useState<WordLookupData | null>(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [notFound, setNotFound] = useState(cached?.notFound || false);
  const [actualWord, setActualWord] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isWordSaved, setIsWordSaved] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [showPhrases, setShowPhrases] = useState(false);
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showRelWords, setShowRelWords] = useState(false);

  useEffect(() => {
    if (!enabled || !word) {
      if (!enabled) { setDetails(null); setNotFound(false); }
      return;
    }

    const isPhrase = word.includes(' ');
    const bw = isPhrase ? getBasePhrase(word) : getBaseWord(word);
    setActualWord(bw);
    setNotFound(false);

    // 1. 缓存命中 → 直接展示，无 loading
    if (wordDataCache.has(bw)) {
      const cachedData = wordDataCache.get(bw)!;
      setDetails(cachedData);
      setNotFound(cachedData.notFound || false);
      setLoading(false);
      return;
    }

    // 2. 正在静默预加载中 → 显示 loading 等待
    if (pendingFetches.has(bw)) {
      setLoading(true);
      setNotFound(false);
      setShowPhrases(false);
      setShowSynonyms(false);
      setShowRelWords(false);
      setSentenceIndex(0);
      setIsFavorited(false);
      setIsWordSaved(false);

      let cancelled = false;
      pendingFetches.get(bw)!.then((data) => {
        if (!cancelled && data) {
          setDetails(data);
          setNotFound(data.notFound || false);
          setLoading(false);
        } else if (!cancelled) {
          setDetails(null);
          setNotFound(false);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    // 3. 无缓存也无预加载 → 正常请求 + 缓存结果
    setLoading(true);
    setNotFound(false);
    setShowPhrases(false);
    setShowSynonyms(false);
    setShowRelWords(false);
    setSentenceIndex(0);
    setIsFavorited(false);
    setIsWordSaved(false);

    let cancelled = false;
    fetchWordLookup(bw)
      .then((data) => {
        if (!cancelled) {
          wordDataCache.set(bw, data);
          setDetails(data);
          setNotFound(data.notFound || false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetails(null);
          setNotFound(false);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, word]);

  useEffect(() => {
    if (enabled && actualWord) {
      setIsWordSaved(savedWords.includes(actualWord.toLowerCase()) || savedPhrases.includes(actualWord.toLowerCase()));
    }
  }, [savedWords, enabled, actualWord]);

  const playAudio = useCallback((url: string | null | undefined) => {
    if (url) {
      new Audio(url).play().catch(() => {});
    }
  }, []);

  const formatPhonetic = useCallback((): string => {
    if (!details) return '';
    const parts: string[] = [];
    if (details.ukphone) parts.push(`UK: /${details.ukphone}/`);
    if (details.usphone) parts.push(`US: /${details.usphone}/`);
    return parts.join('  ');
  }, [details]);

  const formatTrans = useCallback((): string => {
    if (!details || !details.translations.length) return '';
    return details.translations.map(t => `${t.pos} ${t.tran_cn}`).join('；');
  }, [details]);

  const handleSaveToVocab = useCallback(async () => {
    if (!details || isWordSaved) return;
    setIsSaving(true);
    const isPhrase = word.includes(' ');
    try {
      await addVocabularyWord({
        word: details.word,
        isPhrase,
        phonetic: formatPhonetic(),
        trans: formatTrans(),
        pos: details.translations[0]?.pos || '',
        mean: details.translations[0]?.tran_cn || '',
        example: details.sentences[0]?.s_content || '',
        exampleTrans: details.sentences[0]?.s_cn || '',
      });
      setIsWordSaved(true);
      if (onWordSaved) onWordSaved(details.word);
    } catch (e) {
    } finally {
      setIsSaving(false);
    }
  }, [details, isWordSaved, formatPhonetic, formatTrans, onWordSaved]);

  const handleFavoriteSentence = useCallback(async () => {
    if (isFavorited || !details) return;
    const sent = details.sentences[sentenceIndex];
    if (!sent) return;
    setIsFavoriting(true);
    try {
      await addFavoriteSentence({
        en: sent.s_content,
        zh: sent.s_cn,
        videoTitle: '生词例句 (Vocab Example)',
        time: 'Word Details',
      });
      setIsFavorited(true);
    } catch (e) {
    } finally {
      setIsFavoriting(false);
    }
  }, [isFavorited, details, sentenceIndex]);

  const totalSentences = details?.sentences?.length || 0;

  const speakSentence = useCallback((text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }, []);

  return {
    details,
    loading,
    notFound,
    actualWord,
    isSaving,
    isWordSaved,
    isFavorited,
    isFavoriting,
    sentenceIndex,
    setSentenceIndex,
    showPhrases,
    setShowPhrases,
    showSynonyms,
    setShowSynonyms,
    showRelWords,
    setShowRelWords,
    totalSentences,
    playAudio,
    formatPhonetic,
    formatTrans,
    handleSaveToVocab,
    handleFavoriteSentence,
    speakSentence,
  };
}
