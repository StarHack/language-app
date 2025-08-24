import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FlipCard from '../components/FlipCard';
import { loadWordsForReview, saveWordsForReview, ReviewWord } from '../lib/storage';

export default function Repeat() {
  const navigation = useNavigation<any>();
  const [wordsForReview, setWordsForReview] = useState<ReviewWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardKey, setCardKey] = useState(0);

  const total = wordsForReview.length;
  const title = useMemo(() => (total > 0 ? `${Math.min(currentIndex + 1, total)} / ${total}` : 'Repeat'), [currentIndex, total]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => (
        <TouchableOpacity onPress={onRepeatAll} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: '#1E90FF', fontSize: 16 }}>Repeat All</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, title]);

  useEffect(() => {
    const load = async () => {
      const words = await loadWordsForReview();
      const now = Math.floor(Date.now() / 1000);
      const due = words.filter((w) => w.nextReview <= now || w.correctCount === 0);
      setWordsForReview(due);
      setCurrentIndex(0);
      setCardKey((k) => k + 1);
    };
    load();
  }, []);

  const onRepeatAll = async () => {
    const words = await loadWordsForReview();
    setWordsForReview(words);
    setCurrentIndex(0);
    setCardKey((k) => k + 1);
  };

  const adjustRepetitionInterval = (word: ReviewWord, remembered: boolean) => {
    const now = Math.floor(Date.now() / 1000);
    if (remembered) {
      word.correctCount = (word.correctCount || 0) + 1;
      word.interval = word.interval ? word.interval * 2 : 1;
    } else {
      word.correctCount = 0;
      word.interval = 1;
    }
    word.nextReview = now + word.interval * 86400;
    return word;
  };

  const goToNextCard = () => {
    setCardKey((k) => k + 1);
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Alert.alert('All done', 'No more cards for now. Come back later.');
      setCurrentIndex(total);
    }
  };

  const handleRemembered = async (word: ReviewWord) => {
    const updated = adjustRepetitionInterval({ ...word }, true);
    await saveWordsForReview(updated);
    if (updated.correctCount >= 7) {
      setWordsForReview((prev) => {
        const next = prev.filter((w) => w.cleanedWord !== word.cleanedWord);
        setCurrentIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
        setCardKey((k) => k + 1);
        return next;
      });
    } else {
      goToNextCard();
    }
  };

  const handleForgotten = async (word: ReviewWord) => {
    const updated = adjustRepetitionInterval({ ...word }, false);
    await saveWordsForReview(updated);
    goToNextCard();
  };

  const currentWord = wordsForReview[currentIndex];

  return (
    <View style={styles.container}>
      {currentWord ? (
        <FlipCard
          key={cardKey}
          word={currentWord.cleanedWord}
          translation={currentWord.translation}
          onRemembered={() => handleRemembered(currentWord)}
          onForgotten={() => handleForgotten(currentWord)}
        />
      ) : (
        <Text style={styles.noWordsText}>No words to review at the moment</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  noWordsText: { fontSize: 18, color: '#777' },
});
