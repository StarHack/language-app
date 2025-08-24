import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { rootUri, deleteSafely } from '../lib/fs';
import { downloadAndExtractZip } from '../lib/zip';

export default function Settings() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const onDownload = async () => {
    console.log('settings:download:tap');
    if (!rootUri) {
      console.log('settings:error:no-rootUri');
      Alert.alert('Error', 'No document directory available.');
      return;
    }
    try {
      setBusy(true);
      setProgress({ done: 0, total: 0 });
      console.log('settings:cleanup');
      await deleteSafely(rootUri + 'Russian');
      await deleteSafely(rootUri + 'languages');
      await deleteSafely(rootUri + 'languages.zip');
      console.log('settings:download:start', { rootUri });
      await downloadAndExtractZip('https://api.ciao.to/languages.zip', rootUri, (d, t) => {
        console.log('settings:progress', d, '/', t);
        setProgress({ done: d, total: t });
      });
      console.log('settings:download:success');
      setBusy(false);
      setProgress(null);
      Alert.alert('Done', 'Files downloaded and extracted.');
    } catch (e: any) {
      console.log('settings:download:error', e?.name || 'Error', e?.message || String(e));
      setBusy(false);
      Alert.alert('Error', e?.message ? String(e.message) : 'Could not download or extract the ZIP file.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity disabled={busy} onPress={onDownload} style={[styles.button, busy && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{busy ? 'Downloading…' : 'Download Course'}</Text>
      </TouchableOpacity>
      {busy && (
        <View style={styles.row}>
          <ActivityIndicator />
          <Text style={styles.progressText}>
            {progress && progress.total ? `${progress.done}/${progress.total}` : 'Starting…'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16, alignItems: 'center', justifyContent: 'flex-start' },
  title: { fontSize: 20, fontWeight: '600' },
  button: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#1E90FF', borderRadius: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  progressText: { fontSize: 14 },
});
