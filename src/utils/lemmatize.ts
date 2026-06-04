import lemmatizer from 'wink-lemmatizer';

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
