import React from 'react';
import { useNavigation } from '@react-navigation/native';
import FileBrowser from '../components/FileBrowser';
import { rootUri } from '../lib/fs';

export default function Courses() {
  const nav = useNavigation<any>();
  return (
    <FileBrowser
      rootUri={rootUri!}
      startSubfolder="Russian"
      onOpenFile={(uri) => nav.navigate('TextView', { fileUri: uri })}
    />
  );
}
