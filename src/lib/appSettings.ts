import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppSettings = { fontScale: number };

const KEY = 'appSettings';
const defaults: AppSettings = { fontScale: 1 };

export const loadAppSettings = async (): Promise<AppSettings> => {
  try {
    const s = await AsyncStorage.getItem(KEY);
    if (!s) return defaults;
    const parsed = JSON.parse(s);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
};

export const saveAppSettings = async (partial: Partial<AppSettings>) => {
  const cur = await loadAppSettings();
  const next = { ...cur, ...partial };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
};
