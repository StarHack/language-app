import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, PanResponder, LayoutChangeEvent, Easing, UIManager, findNodeHandle } from "react-native";

type Tile = { id: string; label: string; color?: string };
type Row = { id: string; tiles: Tile[] };
type Word = { id: string; text: string; answerTileId: string };

type Result = {
  correct: number;
  total: number;
  details: Array<{ wordId: string; droppedTileId?: string; correct: boolean }>;
};

type Props = {
  rows: Row[];
  words: Word[];
  shuffle?: boolean;
  spacing?: number;
  tileHeight?: number;
  containerStyle?: any;
  tileStyle?: any;
  wordCardStyle?: any;
  onComplete?: (result: Result) => void;
};

const shuffleArray = <T,>(arr: T[]) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function QuizDragTiles({
  rows,
  words,
  shuffle = true,
  spacing = 10,
  tileHeight = 90,
  containerStyle,
  tileStyle,
  wordCardStyle,
  onComplete,
}: Props) {
  const containerRef = useRef<View>(null);
  const tileRefs = useRef<Record<string, View | null>>({});
  const [containerLayout, setContainerLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [tileLayouts, setTileLayouts] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const [cardSize, setCardSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [sequence, setSequence] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result>({ correct: 0, total: words.length, details: [] });
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [feedbackColor, setFeedbackColor] = useState<string | null>(null);

  useEffect(() => {
    const seq = shuffle ? shuffleArray(words) : words.slice();
    setSequence(seq);
    setIndex(0);
    setResults({ correct: 0, total: seq.length, details: [] });
    position.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    opacity.setValue(1);
  }, [rows, words, shuffle]);

  const measureTile = useCallback((tileId: string) => {
    const tileNode = findNodeHandle(tileRefs.current[tileId] as any);
    const containerNode = findNodeHandle(containerRef.current as any);
    if (tileNode && containerNode) {
      UIManager.measureLayout(
        tileNode,
        containerNode,
        () => {},
        (x, y, width, height) => {
          setTileLayouts((prev) => ({ ...prev, [tileId]: { x, y, width, height } }));
        }
      );
    }
  }, []);

  const measureAllTiles = useCallback(() => {
    Object.keys(tileRefs.current).forEach((id) => measureTile(id));
  }, [measureTile]);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setContainerLayout({ x, y, width, height });
    const centerX = width / 2 - cardSize.width / 2;
    const centerY = height / 2 - cardSize.height / 2;
    setStartPos({ x: centerX, y: centerY });
    position.setOffset({ x: centerX, y: centerY });
    position.setValue({ x: 0, y: 0 });
    requestAnimationFrame(measureAllTiles);
  };

  const onCardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (cardSize.width !== width || cardSize.height !== height) {
      setCardSize({ width, height });
      if (containerLayout) {
        const centerX = containerLayout.width / 2 - width / 2;
        const centerY = containerLayout.height / 2 - height / 2;
        setStartPos({ x: centerX, y: centerY });
        position.setOffset({ x: centerX, y: centerY });
        position.setValue({ x: 0, y: 0 });
      }
    }
  };

  useEffect(() => {
    if (containerLayout) requestAnimationFrame(measureAllTiles);
  }, [containerLayout, tileHeight, spacing, rows, measureAllTiles]);

  const resetCard = useCallback(() => {
    position.flattenOffset();
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, bounciness: 8 }).start();
    Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
    setFeedbackColor(null);
  }, [position, scale]);

  const nextWord = useCallback(() => {
    setIndex((i) => i + 1);
    position.setOffset(startPos);
    position.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    opacity.setValue(1);
    setFeedbackColor(null);
  }, [position, startPos, scale, opacity]);

  const updateResults = useCallback(
    (entry: { wordId: string; droppedTileId?: string; correct: boolean }, finished: boolean) => {
      setResults((prev) => {
        const updated = {
          correct: prev.correct + (entry.correct ? 1 : 0),
          total: prev.total,
          details: [...prev.details, entry],
        };
        if (finished && onComplete) onComplete(updated);
        return updated;
      });
    },
    [onComplete]
  );

  const current = sequence[index];
  const incorrectSoFar = results.details.length - results.correct;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          position.extractOffset();
          Animated.timing(scale, { toValue: 1.03, duration: 120, useNativeDriver: true }).start();
        },
        onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, gesture) => {
          position.flattenOffset();
          const dropCenter = {
            x: startPos.x + gesture.dx + cardSize.width / 2,
            y: startPos.y + gesture.dy + cardSize.height / 2,
          };
          let droppedTileId: string | undefined;
          Object.entries(tileLayouts).forEach(([id, r]) => {
            if (dropCenter.x >= r.x && dropCenter.x <= r.x + r.width && dropCenter.y >= r.y && dropCenter.y <= r.y + r.height) {
              droppedTileId = id;
            }
          });
          const isCorrect = !!(droppedTileId && current && droppedTileId === current.answerTileId);
          const finished = index + 1 >= sequence.length;
          const entry = { wordId: current?.id ?? "", droppedTileId, correct: isCorrect };

          if (isCorrect && droppedTileId) {
            const r = tileLayouts[droppedTileId];
            const target = { x: r.x + r.width / 2 - cardSize.width / 2, y: r.y + r.height / 2 - cardSize.height / 2 };
            Animated.parallel([
              Animated.timing(position, { toValue: { x: target.x - startPos.x, y: target.y - startPos.y }, duration: 180, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
              Animated.timing(scale, { toValue: 0.9, duration: 180, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            ]).start(() => {
              updateResults(entry, finished);
              nextWord();
              opacity.setValue(1);
            });
          } else {
            setFeedbackColor("#fca5a5");
            Animated.sequence([
              Animated.timing(position.x, { toValue: -12, duration: 60, useNativeDriver: true }),
              Animated.timing(position.x, { toValue: 12, duration: 60, useNativeDriver: true }),
              Animated.timing(position.x, { toValue: -8, duration: 50, useNativeDriver: true }),
              Animated.timing(position.x, { toValue: 8, duration: 50, useNativeDriver: true }),
              Animated.timing(position.x, { toValue: 0, duration: 40, useNativeDriver: true }),
            ]).start(() => {
              Animated.parallel([
                Animated.timing(scale, { toValue: 0.9, duration: 160, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
              ]).start(() => {
                updateResults(entry, finished);
                nextWord();
                opacity.setValue(1);
              });
            });
          }
        },
      }),
    [tileLayouts, startPos, cardSize, current, index, sequence.length, position, scale, opacity, nextWord, updateResults]
  );

  const renderRow = (row: Row, rowIdx: number) => {
    const cols = row.tiles.length;
    return (
      <View key={row.id} style={[styles.row, { marginBottom: rowIdx < rows.length - 1 ? spacing : 0 }]}>
        {row.tiles.map((tile, i) => (
          <View
            key={tile.id}
            ref={(r) => {
              tileRefs.current[tile.id] = r;
            }}
            onLayout={() => measureTile(tile.id)}
            style={[
              styles.tile,
              {
                height: tileHeight,
                marginRight: i < cols - 1 ? spacing : 0,
                backgroundColor: tile.color || "#e5e7eb",
              },
              tileStyle,
            ]}
          >
            <Text numberOfLines={2} style={styles.tileText}>
              {tile.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View ref={containerRef} onLayout={onContainerLayout} style={[styles.container, { paddingHorizontal: spacing, paddingVertical: spacing }, containerStyle]}>
      <View style={{ width: "100%" }}>{rows.map((r, i) => renderRow(r, i))}</View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Correct: {results.correct}</Text>
        <Text style={styles.summaryText}>Incorrect: {incorrectSoFar}</Text>
      </View>

      {current ? (
        <Animated.View
          onLayout={onCardLayout}
          {...panResponder.panHandlers}
          style={[
            styles.card,
            wordCardStyle,
            {
              transform: [{ translateX: position.x }, { translateY: position.y }, { scale }],
              opacity,
              position: "absolute",
              left: 0,
              top: 0,
              backgroundColor: feedbackColor || "#ffffff",
              zIndex: 10,
            },
          ]}
        >
          <Text style={styles.cardText}>{current.text}</Text>
        </Animated.View>
      ) : (
        <View style={styles.doneWrap}>
          <Text style={styles.doneText}>Готово • Done</Text>
          <Text style={styles.scoreText}>Correct: {results.correct}</Text>
          <Text style={styles.scoreText}>Incorrect: {results.total - results.correct}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  row: { flexDirection: "row", width: "100%", flexShrink: 1 },
  tile: { borderRadius: 14, alignItems: "center", justifyContent: "center", flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, overflow: "hidden" },
  tileText: { textAlign: "center", fontSize: 14, fontWeight: "600", color: "#111827", paddingHorizontal: 8, flexShrink: 1, flexWrap: "wrap" },
  card: { minWidth: 160, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, alignSelf: "center", elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardText: { fontSize: 20, fontWeight: "700", color: "#111827", textAlign: "center" },
  doneWrap: { position: "absolute", alignSelf: "center", alignItems: "center", justifyContent: "center" },
  doneText: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  scoreText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  summary: { marginTop: 10, alignSelf: "center", alignItems: "center" },
  summaryText: { fontSize: 14, fontWeight: "600", color: "#111827" },
});
