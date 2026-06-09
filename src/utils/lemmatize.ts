import lemmatizer from 'wink-lemmatizer';

/** 获取单个单词的原形 */
export function getBaseWord(word: string): string {
  if (!word) return '';
  const w = word.toLowerCase();
  
  const noun = lemmatizer.noun(w);
  if (noun !== w) return noun;

  const verb = lemmatizer.verb(w);
  if (verb !== w) return verb;

  const adj = lemmatizer.adjective(w);
  if (adj !== w) return adj;

  return w;
}

/** 获取短语的原形（对每个单词分别还原后组合） */
export function getBasePhrase(phrase: string): string {
  if (!phrase) return '';
  return phrase
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      const cleaned = word.replace(/[^a-zA-Z']/g, '');
      if (!cleaned) return word;
      return getBaseWord(cleaned);
    })
    .join(' ');
}
