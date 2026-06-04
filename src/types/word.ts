export interface PhraseItem {
  p_cn: string;
  p_content: string;
}

export interface HwdItem {
  hwd?: string;
  tran?: string;
  word?: string;
}

export interface RelWordGroup {
  Hwds: HwdItem[];
  Pos: string;
}

export interface SentenceItem {
  s_cn: string;
  s_content: string;
}

export interface SynonymGroup {
  Hwds: HwdItem[];
  pos: string;
  tran: string;
}

export interface TranslationItem {
  pos: string;
  tran_cn: string;
}

export interface WordLookupData {
  bookId: string | null;
  phrases: PhraseItem[];
  relWords: RelWordGroup[];
  sentences: SentenceItem[];
  synonyms: SynonymGroup[];
  translations: TranslationItem[];
  ukphone: string | null;
  ukspeech: string | null;
  usphone: string | null;
  usspeech: string | null;
  word: string;
}
