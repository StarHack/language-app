import React, { useEffect, useMemo, useState, useLayoutEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View, RefreshControl } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FileItem, getParentDirectory, listDirectory } from '../lib/fs';

type Props = { rootUri: string; startSubfolder?: string; onOpenFile?: (uri: string) => void };

export default function FileBrowser({ rootUri, startSubfolder, onOpenFile }: Props) {
  const navigation = useNavigation<any>();
  const [currentPath, setCurrentPath] = useState(rootUri);
  const [items, setItems] = useState<FileItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const pathLabel = useMemo(() => currentPath.replace(rootUri, ''), [currentPath, rootUri]);
  const atRoot = currentPath === rootUri;

  const bootstrap = async () => {
    if (startSubfolder) {
      const p = rootUri + startSubfolder.replace(/^\/+/, '').replace(/\/?$/, '/');
      const info = await FileSystem.getInfoAsync(p);
      if (info.exists && info.isDirectory) setCurrentPath(p);
    }
  };

  const fetchDirectoryContents = async (path: string) => {
    const listed = await listDirectory(path);
    setItems(listed);
  };

  useEffect(() => {
    bootstrap().then(() => fetchDirectoryContents(currentPath));
  }, []);

  useEffect(() => {
    fetchDirectoryContents(currentPath);
  }, [currentPath]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDirectoryContents(currentPath);
    setRefreshing(false);
  };

  const navigateToParentFolder = () => {
    setCurrentPath(getParentDirectory(currentPath, rootUri));
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: pathLabel || 'Courses',
      headerLeft: atRoot
        ? undefined
        : () => (
            <TouchableOpacity onPress={navigateToParentFolder} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color="#1E90FF" />
              <Text style={styles.backText}>Root</Text>
            </TouchableOpacity>
          ),
    });
  }, [navigation, atRoot, pathLabel]);

  const onPressItem = (item: FileItem) => {
    if (item.isDirectory) setCurrentPath(item.uri);
    else if (onOpenFile) onOpenFile(item.uri);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {items.map((item) => (
          <TouchableOpacity key={item.uri} style={styles.item} onPress={() => onPressItem(item)}>
            <Text style={styles.itemText}>{item.isDirectory ? `📁 ${item.name}` : `📄 ${item.name}`}</Text>
          </TouchableOpacity>
        ))}
        {items.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Empty</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 12 },
  item: { padding: 12, borderRadius: 8, backgroundColor: '#f2f2f6', marginBottom: 8 },
  itemText: { fontSize: 16 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#999' },
  back: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  backText: { fontSize: 16, color: '#1E90FF' },
});
