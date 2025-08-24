import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Image, View, Dimensions, Modal, Button, TextStyle, Platform, ActionSheetIOS } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { readExcelFile, readMarkdownFile } from '../lib/readers';
import { loadWordsForReview, addWordForReview, removeWordForReview } from '../lib/storage';
import { useRoute, useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

type MDHeading = { type: 'heading'; content: string; level: number };
type MDBold = { type: 'bold'; content: string };
type MDIta = { type: 'italic'; content: string };
type MDUnder = { type: 'underline'; content: string };
type MDLink = { type: 'link'; content: string; url: string };
type MDImage = { type: 'image'; alt: string; url: string };
type MDTable = { type: 'table'; cells: string[] };
type MDText = { type: 'text'; content: string };
type MDNewline = { type: 'newline' };
type MDSeparator = { type: 'separator' };
type MDElement = MDHeading | MDBold | MDIta | MDUnder | MDLink | MDImage | MDTable | MDText | MDNewline | MDSeparator;

const parseMarkdown = (text: string): MDElement[] => {
  const elements: MDElement[] = [];
  const regex = /(#{1,6} [^\n]+)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)]+\))|(!\[[^\]]*\]\([^)]+\))|(\|.+\|)|(^---$)|(\S+)|(\n)/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      const level = (match[1].match(/^#+/) as RegExpMatchArray)[0].length;
      elements.push({ type: 'heading', content: match[1].replace(/^#+ /, ''), level });
    } else if (match[2]) {
      elements.push({ type: 'bold', content: match[2].slice(2, -2) });
    } else if (match[3]) {
      elements.push({ type: 'italic', content: match[3].slice(1, -1) });
    } else if (match[4]) {
      elements.push({ type: 'underline', content: match[4].slice(1, -1) });
    } else if (match[5]) {
      const m = /\[([^\]]+)\]\(([^)]+)\)/.exec(match[5]) as RegExpExecArray;
      elements.push({ type: 'link', content: m[1], url: m[2] });
    } else if (match[6]) {
      const m = /!\[([^\]]*)\]\(([^)]+)\)/.exec(match[6]) as RegExpExecArray;
      elements.push({ type: 'image', alt: m[1], url: m[2] });
    } else if (match[7]) {
      const cells = match[7].split('|').slice(1, -1).map((cell) => cell.trim());
      elements.push({ type: 'table', cells });
    } else if (match[8]) {
      elements.push({ type: 'separator' });
    } else if (match[9]) {
      elements.push({ type: 'text', content: match[9] });
    } else if (match[10]) {
      elements.push({ type: 'newline' });
    }
  }
  return elements;
};

export default function TextView() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const fileUri: string = route.params.fileUri;
  const [markdownText, setMarkdownText] = useState('');
  const [excelContent, setExcelContent] = useState<{ firstColumn: string; secondColumn: string }[]>([]);
  const [tappedWords, setTappedWords] = useState<string[]>([]);
  const [translatedWords, setTranslatedWords] = useState<{ cleanedWord: string; translation: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [fontModalVisible, setFontModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    const load = async () => {
      const md = await readMarkdownFile(fileUri);
      setMarkdownText(md);
      const ex = await readExcelFile(fileUri.replace(/\.md$/i, '.xlsx'));
      setExcelContent(ex);
      const saved = await loadWordsForReview();
      const tapped = saved.map((w: any) => w.rawWord);
      const translated = saved.map((w: any) => ({ cleanedWord: w.cleanedWord, translation: w.translation }));
      setTappedWords(tapped);
      setTranslatedWords(translated);
    };
    load();
  }, [fileUri]);

  const openMenu = () => {
    if (Platform.OS === 'ios') {
      const options = ['Words', 'Font Size', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 2 }, (i) => {
        if (i === 0) setModalVisible(true);
        if (i === 1) setFontModalVisible(true);
      });
    } else {
      setMenuVisible(true);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={openMenu} style={{ paddingHorizontal: 10 }}>
          <Ionicons name="menu" size={22} color="#1E90FF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, tappedWords, fontScale]);

  const translateWord = (word: string) => {
    const cleanedWord = word.replace(/[.,:;]$/, '').toLowerCase();
    const found = excelContent.find(
      (row) =>
        row.firstColumn?.toLowerCase() === cleanedWord ||
        row.secondColumn?.toLowerCase() === cleanedWord
    );
    if (!found) return word;
    return found.firstColumn.toLowerCase() === cleanedWord ? found.secondColumn : found.firstColumn;
  };

  const onWordPress = (word: string) => {
    const cleanedWord = word.replace(/[.,:;]$/, '').toLowerCase();
    const translation = translateWord(cleanedWord);
    if (tappedWords.includes(word)) {
      setTappedWords((p) => p.filter((w) => w !== word));
      setTranslatedWords((p) => p.filter((x) => x.cleanedWord !== cleanedWord));
      removeWordForReview(cleanedWord);
    } else {
      setTappedWords((p) => [...p, word]);
      setTranslatedWords((p) => [...p, { cleanedWord, translation }]);
      addWordForReview(word, cleanedWord, translation);
    }
  };

  const parsed = useMemo(() => parseMarkdown(markdownText), [markdownText]);

  const baseSize = 16 * fontScale;
  const getHeadingStyle = (level: number): TextStyle => {
    if (level === 1) return { fontSize: 28 * fontScale, fontWeight: 'bold', marginVertical: 10, color: '#333' };
    if (level === 2) return { fontSize: 24 * fontScale, fontWeight: 'bold', marginVertical: 8, color: '#333' };
    if (level === 3) return { fontSize: 20 * fontScale, fontWeight: 'bold', marginVertical: 6, color: '#333' };
    return { fontSize: baseSize, color: '#333' };
  };

  const renderMarkdownForTable = (elements: MDElement[]) =>
    elements.map((el, i) => {
      switch (el.type) {
        case 'bold':
          return <Text key={i} style={[styles.bold, { fontSize: baseSize }]}>{el.content + ' '}</Text>;
        case 'italic':
          return <Text key={i} style={[styles.italic, { fontSize: baseSize }]}>{el.content + ' '}</Text>;
        case 'underline':
          return <Text key={i} style={[styles.underline, { fontSize: baseSize }]}>{el.content + ' '}</Text>;
        case 'link':
          return <Text key={i} style={[styles.link, { fontSize: baseSize }]}>{el.content + ' '}</Text>;
        default:
          return <Text key={i} style={{ fontSize: baseSize }}>{(el as MDText).content + ' '}</Text>;
      }
    });

  const renderMarkdown = (elements: MDElement[]) =>
    elements.map((el, i) => {
      const isTapped = 'content' in el && tappedWords.includes((el as any).content);
      const textStyle = [styles.text, { fontSize: baseSize }, isTapped ? styles.tappedWord : null] as any;
      switch (el.type) {
        case 'heading':
          return <Text key={i} style={[getHeadingStyle(el.level), textStyle]}>{el.content}</Text>;
        case 'bold':
          return (
            <TouchableOpacity key={i} onPress={() => onWordPress(el.content)}>
              <Text style={[styles.bold, { fontSize: baseSize }]}>{el.content + ' '}</Text>
            </TouchableOpacity>
          );
        case 'italic':
          return (
            <TouchableOpacity key={i} onPress={() => onWordPress(el.content)}>
              <Text style={[styles.italic, { fontSize: baseSize }]}>{el.content + ' '}</Text>
            </TouchableOpacity>
          );
        case 'underline':
          return (
            <TouchableOpacity key={i} onPress={() => onWordPress(el.content)}>
              <Text style={[styles.underline, { fontSize: baseSize }]}>{el.content + ' '}</Text>
            </TouchableOpacity>
          );
        case 'link':
          return (
            <TouchableOpacity key={i} onPress={() => {}}>
              <Text style={[styles.link, { fontSize: baseSize }]}>{el.content + ' '}</Text>
            </TouchableOpacity>
          );
        case 'image':
          return (
            <View key={i} style={styles.imageContainer}>
              <Image source={{ uri: el.url }} style={styles.image} />
              <Text style={styles.imageAlt}>{el.alt}</Text>
            </View>
          );
        case 'table': {
          const numColumns = el.cells.length;
          const columnWidth = screenWidth / numColumns;
          return (
            <View key={i} style={styles.tableRow}>
              {el.cells.map((cell, j) => (
                <Text key={j} style={[styles.tableCell, { width: columnWidth }]}>
                  {renderMarkdownForTable(parseMarkdown(cell))}
                </Text>
              ))}
            </View>
          );
        }
        case 'separator':
          return <View key={i} style={styles.separator} />;
        case 'newline':
          return <Text key={i}>{'\n'}</Text>;
        default:
          return (
            <TouchableOpacity key={i} onPress={() => onWordPress((el as MDText).content)}>
              <Text style={textStyle}>{(el as MDText).content + ' '}</Text>
            </TouchableOpacity>
          );
      }
    });

  return (
    <TouchableWithoutFeedback>
      <ScrollView style={[styles.scrollView, styles.container]}>
        <Text>{renderMarkdown(parsed)}</Text>

        {Platform.OS !== 'ios' && (
          <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
            <View style={styles.menuOverlay}>
              <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setModalVisible(true); }}>
                  <Text style={styles.menuText}>Words</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setFontModalVisible(true); }}>
                  <Text style={styles.menuText}>Font Size</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                  <Text style={styles.menuText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView style={[styles.scrollView, styles.container]}>
                {translatedWords.map((item, index) => (
                  <Text key={index} style={styles.modalText}>
                    {item.cleanedWord} - {item.translation}
                  </Text>
                ))}
              </ScrollView>
              <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>

        <Modal visible={fontModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 16, marginBottom: 12 }}>Font Size</Text>
              <Slider
                style={{ width: 240, height: 40 }}
                minimumValue={0.6}
                maximumValue={2}
                step={0.05}
                value={fontScale}
                onValueChange={setFontScale}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 240 }}>
                <Text style={{ fontSize: 12 }}>A</Text>
                <Text style={{ fontSize: 20 }}>A</Text>
              </View>
              <View style={{ height: 12 }} />
              <Button title="Done" onPress={() => setFontModalVisible(false)} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  scrollView: { marginVertical: 20 },
  text: { color: '#333' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  link: { color: '#1E90FF', textDecorationLine: 'underline' },
  imageContainer: { marginVertical: 10, alignItems: 'center' },
  image: { width: 200, height: 150, resizeMode: 'contain' },
  imageAlt: { marginTop: 5, fontStyle: 'italic', color: '#666' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tableCell: { borderRightWidth: 1, borderColor: '#ddd', padding: 8, textAlign: 'center' },
  separator: { borderBottomColor: '#ccc', borderBottomWidth: 1, marginVertical: 10 },
  heading1: { fontSize: 28, fontWeight: 'bold', marginVertical: 10 },
  heading2: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  heading3: { fontSize: 20, fontWeight: 'bold', marginVertical: 6 },
  tappedWord: { color: 'red' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: 300, padding: 20, backgroundColor: 'white', borderRadius: 8, alignItems: 'center' },
  modalText: { fontSize: 16, marginVertical: 2 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuCard: { backgroundColor: '#fff', paddingVertical: 8 },
  menuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  menuText: { fontSize: 16, color: '#222' },
});
