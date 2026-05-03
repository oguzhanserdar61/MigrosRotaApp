import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BrandIcon } from './BrandIcon';
import { Colors, getBrand } from '../constants/theme';
import type { StoreRow } from '../utils/magazaData';

interface Props {
  row: StoreRow;
  index: number;
  isSelected: boolean;
  isFirst: boolean;
  selIndex: number;
  onPress: () => void;
}

export function MagazaKarti({ row, index, isSelected, isFirst, selIndex, onPress }: Props) {
  const [, , , adres, isim, , brandCode] = row;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isFirst && styles.firstContainer,
        isSelected && !isFirst && styles.selectedContainer,
        pressed && styles.pressed,
      ]}
    >
      {/* Sıra numarası */}
      <View style={[
        styles.numBox,
        isFirst && styles.numBoxFirst,
        isSelected && !isFirst && styles.numBoxSelected,
      ]}>
        <Text style={[
          styles.numText,
          isFirst && styles.numTextFirst,
          isSelected && !isFirst && styles.numTextSelected,
        ]}>
          {isFirst ? '★' : isSelected ? selIndex + 1 : index + 1}
        </Text>
      </View>

      {/* Brand icon */}
      <BrandIcon brandCode={brandCode} size={28} inverted={isFirst} />

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.isim, isFirst && styles.isimFirst]}
          numberOfLines={1}
        >
          {isim}
        </Text>
        <Text
          style={[styles.adres, isFirst && styles.adresFirst]}
          numberOfLines={1}
        >
          {adres}
        </Text>
      </View>

      {/* Seçili işareti */}
      {isSelected && !isFirst && (
        <Text style={styles.check}>✓</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  firstContainer: {
    backgroundColor: Colors.orange,
  },
  selectedContainer: {
    backgroundColor: Colors.orangeLight,
  },
  pressed: {
    opacity: 0.7,
  },
  numBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    borderWidth: 0.5,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBoxFirst: {
    backgroundColor: 'white',
  },
  numBoxSelected: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  numText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.txt2,
  },
  numTextFirst: {
    color: Colors.orange,
  },
  numTextSelected: {
    color: 'white',
  },
  info: {
    flex: 1,
  },
  isim: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.txt,
  },
  isimFirst: {
    color: 'white',
  },
  adres: {
    fontSize: 11,
    color: Colors.txt2,
    marginTop: 1,
  },
  adresFirst: {
    color: 'rgba(255,255,255,0.8)',
  },
  check: {
    fontSize: 14,
    color: '#1A7F4B',
    fontWeight: '600',
  },
});
