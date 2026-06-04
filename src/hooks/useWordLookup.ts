import { useState, useEffect, useCallback } from 'react';
import { fetchWordLookup, addVocabularyWord, addFavoriteSentence } from '@api/general';
import { getBaseWord } from '../utils/lemmatize';
import type { WordLookupData } from '../types/word';

interface UseWordLookupOptions {
  word: string;
  enabled?: boolean;
  savedWords?: string[];
  onWordSaved?: (word: string) => void;
}

export function useWordLookup({ word, enabled = true, savedWords = [], onWordSaved }: UseWordLookupOptions) {
  const [details, setDetails] = useState<WordLookupData | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (enabled && word) {
      setLoading(true);
      setShowPhrases(false);
      setShowSynonyms(false);
      setShowRelWords(false);
      setSentenceIndex(0);
      setIsFavorited(false);
      setIsWordSaved(false);

      const baseWord = getBaseWord(word);
      setActualWord(baseWord);

      fetchWordLookup(baseWord)
        .then(data => {
          setDetails(data);
          setLoading(false);
        })
        .catch(() => {
          setDetails(null);
          setLoading(false);
        });
    } else if (!enabled) {
      setDetails(null);
    }
  }, [enabled, word]);

  useEffect(() => {
    if (enabled && actualWord) {
      setIsWordSaved(savedWords.includes(actualWord.toLowerCase()));
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
    try {
      await addVocabularyWord({
        word: details.word,
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

  return {
    details,
    loading,
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
  };
}
