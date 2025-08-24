import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

export const readMarkdownFile = async (fileUri: string) => {
  try {
    return await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    return '';
  }
};

export const readExcelFile = async (fileUri: string) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const wb = XLSX.read(base64, { type: 'base64' });
    const sheetName = 'Words';
    const ws = wb.Sheets[sheetName];
    if (!ws) return [];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    return rows.map((r) => ({ firstColumn: r?.[0], secondColumn: r?.[1] })).filter((r) => r.firstColumn || r.secondColumn);
  } catch {
    return [];
  }
};
