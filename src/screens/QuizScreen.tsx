import React, { useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, Alert } from "react-native";
import QuizDragTiles from "../components/QuizDragTiles";

type Tile = { id: string; label: string; color?: string };
type Row = { id: string; tiles: Tile[] };
type Word = { id: string; text: string; answerTileId: string };

const defaultRows: Row[] = [
  {
    id: "row-1",
    tiles: [
      { id: "noun", label: "Существительное \\ noun", color: "#fde68a" },
      { id: "verb", label: "Глагол \\ verb", color: "#a7f3d0" },
      { id: "adjective", label: "Прилагательное \\ adjective", color: "#93c5fd" },
    ],
  },
  {
    id: "row-2",
    tiles: [
      { id: "pronoun", label: "Местоимение \\ pronoun", color: "#fca5a5" },
      { id: "adverb", label: "Наречие \\ adverb", color: "#c4b5fd" },
    ],
  },
];

const defaultWords: Word[] = [
  { id: "w1", text: "дом", answerTileId: "noun" },
  { id: "w2", text: "книга", answerTileId: "noun" },
  { id: "w3", text: "город", answerTileId: "noun" },
  { id: "w4", text: "бежать", answerTileId: "verb" },
  { id: "w5", text: "писать", answerTileId: "verb" },
  { id: "w6", text: "думать", answerTileId: "verb" },
  { id: "w7", text: "быстрый", answerTileId: "adjective" },
  { id: "w8", text: "большой", answerTileId: "adjective" },
  { id: "w9", text: "счастливый", answerTileId: "adjective" },
  { id: "w10", text: "она", answerTileId: "pronoun" },
  { id: "w11", text: "они", answerTileId: "pronoun" },
  { id: "w12", text: "он", answerTileId: "pronoun" },
  { id: "w13", text: "быстро", answerTileId: "adverb" },
  { id: "w14", text: "часто", answerTileId: "adverb" },
  { id: "w15", text: "тихо", answerTileId: "adverb" },
];

export default function QuizScreen({ route }: any) {
  const params = route?.params || {};
  const rows: Row[] = useMemo(() => params.rows || defaultRows, [params.rows]);
  const words: Word[] = useMemo(() => params.words || defaultWords, [params.words]);
  const shuffle = params.shuffle !== undefined ? !!params.shuffle : true;
  const title: string = params.title || "Категоризатор частей речи";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Перетащите слово на правильную плитку</Text>
      </View>
      <View style={styles.body}>
        <QuizDragTiles
          rows={rows}
          words={words}
          shuffle={shuffle}
          spacing={12}
          tileHeight={96}
          containerStyle={styles.quizContainer}
          tileStyle={styles.tile}
          wordCardStyle={styles.card}
          onComplete={(r) => {
            Alert.alert("Готово", `Результат: ${r.correct}/${r.total}`);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  body: { flex: 1 },
  quizContainer: { paddingHorizontal: 12 },
  tile: { borderRadius: 16 },
  card: { minWidth: 180 },
});
