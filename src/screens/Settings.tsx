import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { rootUri, deleteSafely } from '../lib/fs';
import { downloadAndExtractZip } from '../lib/zip';

export default function Settings() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const onDownload = async () => {
    if (!rootUri) {
      Alert.alert('Error', 'No document directory available.');
      return;
    }
    try {
      setBusy(true);
      setProgress({ done: 0, total: 0 });
      await deleteSafely(rootUri + 'Russian');
      await deleteSafely(rootUri + 'languages');
      await deleteSafely(rootUri + 'languages.zip');
      await deleteSafely(rootUri + '__MACOSX');
      await downloadAndExtractZip('https://api.ciao.to/languages.zip', rootUri, (d, t) => {
        setProgress({ done: d, total: t });
      });
      setBusy(false);
      setProgress(null);
      Alert.alert('Done', 'Files downloaded and extracted.');
    } catch (e: any) {
      setBusy(false);
      Alert.alert('Error', e?.message ? String(e.message) : 'Could not download or extract the ZIP file.');
    }
  };

  const onDeleteLocal = async () => {
    if (!rootUri) {
      Alert.alert('Error', 'No document directory available.');
      return;
    }
    Alert.alert('Delete local content?', 'This will remove all downloaded courses from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusy(true);
            setProgress(null);
            await deleteSafely(rootUri + 'Russian');
            await deleteSafely(rootUri + 'languages');
            await deleteSafely(rootUri + 'languages.zip');
            await deleteSafely(rootUri + '__MACOSX');
            setBusy(false);
            Alert.alert('Done', 'Local course content deleted.');
          } catch (e: any) {
            setBusy(false);
            Alert.alert('Error', e?.message ? String(e.message) : 'Could not delete local content.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity disabled={busy} onPress={onDownload} style={[styles.button, busy && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{busy ? 'Downloading…' : 'Download Course'}</Text>
      </TouchableOpacity>
      <TouchableOpacity disabled={busy} onPress={onDeleteLocal} style={[styles.buttonDanger, busy && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>Delete Local Content</Text>
      </TouchableOpacity>
      {busy && (
        <View style={styles.row}>
          <ActivityIndicator />
          <Text style={styles.progressText}>{progress && progress.total ? `${progress.done}/${progress.total}` : 'Working…'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16, alignItems: 'center', justifyContent: 'flex-start' },
  button: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#1E90FF', borderRadius: 8 },
  buttonDanger: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#F44336', borderRadius: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  progressText: { fontSize: 14 },
});
