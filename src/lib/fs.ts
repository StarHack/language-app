import * as FileSystem from 'expo-file-system';

export const rootUri = FileSystem.documentDirectory ?? 'file:///';

export type FileItem = { name: string; uri: string; isDirectory: boolean };

export const ensureDirectoryExists = async (fileUri: string) => {
  const dir = fileUri.slice(0, fileUri.lastIndexOf('/') + 1);
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

export const writeBase64 = async (fileUri: string, base64: string) => {
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
};

export const deleteSafely = async (uri: string) => {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
};

export const getParentDirectory = (uri: string, root: string) => {
  if (uri === root) return root;
  const u = uri.replace(/\/+$/, '');
  const idx = u.lastIndexOf('/');
  const parent = idx > -1 ? u.slice(0, idx + 1) : root;
  return parent.length < root.length ? root : parent;
};

export const listDirectory = async (path: string): Promise<FileItem[]> => {
  const names = await FileSystem.readDirectoryAsync(path);
  const listed = await Promise.all(
    names
      .filter(
        (n) =>
          n !== '__MACOSX' &&
          n !== '.DS_Store' &&
          n !== 'RCTAsyncLocalStorage' &&
          !/\.xlsx$/i.test(n)
      )
      .map(async (name) => {
        const entryPath = path + name;
        const info = await FileSystem.getInfoAsync(entryPath);
        const isDirectory = !!info.isDirectory;
        const uri = isDirectory ? entryPath.replace(/\/?$/, '/') : entryPath;
        return { name, uri, isDirectory };
      })
  );
  listed.sort((a, b) => (a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : a.isDirectory ? -1 : 1));
  return listed;
};
