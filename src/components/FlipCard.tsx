// src/components/FlipCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, TouchableWithoutFeedback, Platform } from 'react-native';

type Props = {
  word: string;
  translation: string;
  onRemembered: () => void;
  onForgotten: () => void;
};

export default function FlipCard({ word, translation, onRemembered, onForgotten }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const flipTo = (to: number) => {
    Animated.timing(anim, {
      toValue: to,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setFlipped(to === 180));
  };

  const toggle = () => {
    flipTo(flipped ? 0 : 180);
  };

  useEffect(() => {
    anim.setValue(0);
    setFlipped(false);
  }, [word]);

  const frontRotate = anim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate = anim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const frontStyle = { transform: [{ perspective: 1000 }, { rotateY: frontRotate }, { scale: anim.interpolate({ inputRange: [0, 180], outputRange: [1, 1] }) }] };
  const backStyle = { transform: [{ perspective: 1000 }, { rotateY: backRotate }, { scale: anim.interpolate({ inputRange: [0, 180], outputRange: [1, 1] }) }] };

  return (
    <TouchableWithoutFeedback onPress={toggle}>
      <View style={styles.card}>
        <Animated.View style={[styles.face, styles.front, frontStyle]}>
          <Text style={styles.wordText}>{word}</Text>
        </Animated.View>
        <Animated.View style={[styles.face, styles.back, backStyle]}>
          <Text style={styles.translationText}>{translation}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onRemembered} style={styles.buttonYes}>
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onForgotten} style={styles.buttonNo}>
              <Text style={styles.buttonText}>No</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 220,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  face: {
    position: 'absolute',
    width: 320,
    height: 220,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    padding: 20,
  },
  front: {
    backgroundColor: '#fff',
  },
  back: {
    backgroundColor: '#fff',
    transform: [{ rotateY: '180deg' }],
  },
  wordText: {
    fontSize: 28,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  translationText: {
    fontSize: 22,
    color: '#007AFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
  },
  buttonYes: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  buttonNo: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});
