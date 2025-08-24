import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ExcelPair = { firstColumn: string; secondColumn: string };

const toStr = (v: unknown) => (v === undefined || v === null ? '' : String(v));
const isJunkPath = (p?: string) => !!p && (p.includes('/__MACOSX/') || /\/\._/.test(p));
const normalize = (s: unknown) => toStr(s).trim().toLowerCase();

const KEY = 'wordsForReview';

const nowSec = () => Math.floor(Date.now() / 1000);

export type ReviewWord = {
  rawWord: string;
  cleanedWord: string;
  translation: string;
  correctCount: number;
  interval: number;
  nextReview: number;
};

export const loadWordsForReview = async (): Promise<ReviewWord[]> => {
  try {
    const s = await AsyncStorage.getItem(KEY);
    const arr = s ? (JSON.parse(s) as any[]) : [];
    return arr.map((w) => ({
      rawWord: String(w.rawWord ?? ''),
      cleanedWord: String(w.cleanedWord ?? '').toLowerCase(),
      translation: String(w.translation ?? ''),
      correctCount: Number.isFinite(w.correctCount) ? Number(w.correctCount) : 0,
      interval: Number.isFinite(w.interval) ? Number(w.interval) : 1,
      nextReview: Number.isFinite(w.nextReview) ? Number(w.nextReview) : nowSec(),
    }));
  } catch {
    return [];
  }
};

const saveAll = async (list: ReviewWord[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
};

export const addWordForReview = async (rawWord: string, cleanedWord: string, translation: string) => {
  const cur = await loadWordsForReview();
  const clean = cleanedWord.toLowerCase();
  const existing = cur.find((w) => w.cleanedWord === clean);
  const base: ReviewWord = existing ?? {
    rawWord,
    cleanedWord: clean,
    translation,
    correctCount: 0,
    interval: 1,
    nextReview: nowSec(),
  };
  base.rawWord = rawWord;
  base.translation = translation;
  const next = [...cur.filter((w) => w.cleanedWord !== clean), base];
  await saveAll(next);
};

export const removeWordForReview = async (cleanedWord: string) => {
  const cur = await loadWordsForReview();
  const next = cur.filter((w) => w.cleanedWord !== cleanedWord.toLowerCase());
  await saveAll(next);
};

export const saveWordsForReview = async (updated: ReviewWord) => {
  const cur = await loadWordsForReview();
  const next = [...cur.filter((w) => w.cleanedWord !== updated.cleanedWord), updated];
  await saveAll(next);
};

export const readMarkdownFile = async (fileUri?: string) => {
  try {
    if (!fileUri || isJunkPath(fileUri)) return '';
    return await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    return '';
  }
};

export const readExcelFile = async (fileUri?: string, sheetName = 'Words') => {
  try {
    if (!fileUri || isJunkPath(fileUri)) return [] as ExcelPair[];
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const wb = XLSX.read(base64, { type: 'base64' });
    const ws = wb.Sheets[sheetName];
    if (!ws) return [] as ExcelPair[];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown as any[][];
    return rows
      .map((r) => ({ firstColumn: toStr(r?.[0]), secondColumn: toStr(r?.[1]) }))
      .filter((r) => r.firstColumn || r.secondColumn);
  } catch {
    return [] as ExcelPair[];
  }
};

export const fileExists = async (fileUri?: string) => {
  try {
    if (!fileUri) return false;
    const info = await FileSystem.getInfoAsync(fileUri);
    return !!info.exists;
  } catch {
    return false;
  }
};

export const siblingWithExt = (fileUri: string | undefined, newExt: string) => {
  if (!fileUri) return '';
  return fileUri.replace(/\.[^/.]+$/i, '') + (newExt.startsWith('.') ? newExt : `.${newExt}`);
};

export const readExcelAsMap = async (fileUri?: string, sheetName = 'Words') => {
  const pairs = await readExcelFile(fileUri, sheetName);
  const m = new Map<string, string>();
  for (const { firstColumn, secondColumn } of pairs) {
    const a = normalize(firstColumn);
    const b = normalize(secondColumn);
    if (a) m.set(a, secondColumn || '');
    if (b) m.set(b, firstColumn || '');
  }
  return m;
};

export const translateWithMap = (map: Map<string, string>, raw: string) => {
  const key = normalize(raw.replace(/[.,:;!?]$/, ''));
  return map.get(key) ?? raw;
};

export const readTranslationsForMarkdown = async (markdownUri?: string, sheetName = 'Words') => {
  const xlsxUri = siblingWithExt(markdownUri, '.xlsx');
  if (!xlsxUri) return new Map<string, string>();
  return await readExcelAsMap(xlsxUri, sheetName);
};
