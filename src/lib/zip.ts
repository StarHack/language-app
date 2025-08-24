import JSZip from 'jszip';
import { ensureDirectoryExists, writeBase64 } from './fs';

const headerSnapshot = (res: Response) => {
  const ct = res.headers.get('content-type');
  const cl = res.headers.get('content-length');
  const se = res.headers.get('server');
  return { 'content-type': ct, 'content-length': cl, server: se };
};

const errorToString = (e: any) => {
  if (!e) return 'unknown';
  if (typeof e === 'string') return e;
  return `${e.name || 'Error'}: ${e.message || String(e)}`;
};

const fetchBufferVerbose = async (url: string) => {
  const ts = Date.now();
  console.log('zip:fetch:start', url);
  try {
    const r = await fetch(`${url}?t=${ts}`);
    console.log('zip:fetch:https:status', r.status, headerSnapshot(r));
    if (!r.ok) throw new Error(`status ${r.status}`);
    const buf = await r.arrayBuffer();
    console.log('zip:fetch:https:bytes', buf.byteLength);
    return buf;
  } catch (e) {
    console.log('zip:fetch:https:error', errorToString(e));
    const httpUrl = url.replace(/^https:/, 'http:');
    console.log('zip:fetch:http:fallback', httpUrl);
    const r2 = await fetch(`${httpUrl}?t=${ts}`);
    console.log('zip:fetch:http:status', r2.status, headerSnapshot(r2));
    if (!r2.ok) throw new Error(`status ${r2.status}`);
    const buf2 = await r2.arrayBuffer();
    console.log('zip:fetch:http:bytes', buf2.byteLength);
    return buf2;
  }
};

export const downloadAndExtractZip = async (
  zipUrl: string,
  destinationRoot: string,
  onProgress?: (done: number, total: number) => void
) => {
  console.log('zip:extract:start', { zipUrl, destinationRoot });
  const buf = await fetchBufferVerbose(zipUrl);
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch (e) {
    console.log('zip:parse:error', errorToString(e));
    throw e;
  }
  const allNames = Object.keys(zip.files);
  const names = allNames.filter((n) => !zip.files[n].dir && !n.includes('.DS_Store'));
  console.log('zip:entries', { total: allNames.length, files: names.length, dirs: allNames.length - names.length });

  let done = 0;
  const failures: { name: string; error: string }[] = [];
  for (const name of names) {
    const fileUri = destinationRoot + name;
    try {
      if (done % 25 === 0) console.log('zip:progress', { done, total: names.length, current: name });
      await ensureDirectoryExists(fileUri);
      const base64 = await zip.files[name].async('base64');
      await writeBase64(fileUri, base64);
      done += 1;
      if (onProgress) onProgress(done, names.length);
    } catch (e) {
      const err = errorToString(e);
      console.log('zip:file:error', { name, fileUri, error: err });
      failures.push({ name, error: err });
    }
  }

  console.log('zip:extract:done', { done, total: names.length, failures: failures.length });
  if (failures.length) {
    throw new Error(`extracted ${done}/${names.length}, failures=${failures.length}`);
  }
};
