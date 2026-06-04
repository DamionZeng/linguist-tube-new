export interface WordScore {
  status: 'correct' | 'incorrect' | 'unrecognized';
}

export interface SentenceScore {
  words: WordScore[];
  score: number;
  recognizedText: string;
}

function cleanWord(w: string): string {
  return w.replace(/[^a-zA-Z']/g, '').toLowerCase();
}

function normalizeWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map(cleanWord)
    .filter((w) => w.length > 0);
}

export function compareSentence(originalText: string, recognizedText: string): SentenceScore {
  const originalWords = normalizeWords(originalText);
  const recognizedWords = normalizeWords(recognizedText);

  if (originalWords.length === 0) {
    return { words: [], score: 0, recognizedText };
  }

  const matched = new Array(recognizedWords.length).fill(false);
  const windowSize = Math.max(3, Math.floor(originalWords.length * 0.4));

  let lastMatchedRecognizedIdx = -1;

  for (let i = 0; i < originalWords.length; i++) {
    const ow = originalWords[i];
    let bestIdx = -1;
    let bestScore = 0;

    const searchStart = Math.max(0, i - windowSize);
    const searchEnd = Math.min(recognizedWords.length, i + windowSize + 1);

    for (let j = searchStart; j < searchEnd; j++) {
      if (matched[j]) continue;
      const rw = recognizedWords[j];

      if (ow === rw) {
        bestIdx = j;
        break;
      }

      if (ow.length >= 3 && rw.length >= 3) {
        const commonPrefix = getCommonPrefixLength(ow, rw);
        const similarity = commonPrefix / Math.max(ow.length, rw.length);
        if (similarity > 0.6 && similarity > bestScore) {
          bestScore = similarity;
          bestIdx = j;
        }
      }
    }

    if (bestIdx >= 0) {
      matched[bestIdx] = true;
      lastMatchedRecognizedIdx = bestIdx;
    }
  }

  const results: WordScore[] = originalWords.map((_ow, i) => {
    const isUnrecognized =
      recognizedWords.length > 0 &&
      i > lastMatchedRecognizedIdx + windowSize + 1;
    if (isUnrecognized) {
      return { status: 'unrecognized' };
    }

    const ow = originalWords[i];
    let found = false;

    const searchStart = Math.max(0, i - windowSize);
    const searchEnd = Math.min(recognizedWords.length, i + windowSize + 1);

    for (let j = searchStart; j < searchEnd; j++) {
      const rw = recognizedWords[j];

      if (ow === rw) {
        found = true;
        break;
      }

      if (ow.length >= 3 && rw.length >= 3) {
        const commonPrefix = getCommonPrefixLength(ow, rw);
        const similarity = commonPrefix / Math.max(ow.length, rw.length);
        if (similarity > 0.6) {
          found = true;
          break;
        }
      }
    }

    return { status: found ? 'correct' : 'incorrect' };
  });

  const correctCount = results.filter((r) => r.status === 'correct').length;
  const evaluableCount = results.filter((r) => r.status !== 'unrecognized').length;
  const score = evaluableCount > 0
    ? Math.round((correctCount / evaluableCount) * 100)
    : 0;

  return { words: results, score, recognizedText };
}

function getCommonPrefixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return i;
}
