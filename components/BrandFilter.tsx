import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { BrandColors } from '../constants/theme';
import { useFilterStore } from '../store/filterStore';
import { pressHandlers } from '../utils/webPress';
import { getAvailableBrands } from '../utils/magazaData';

export function BrandFilter() {
  const { il, ilce, activeBrands, brandToggle } = useFilterStore();

  const availableKeys = useMemo(() => {
    const available = getAvailableBrands(il, ilce);
    return Object.keys(BrandColors).filter(key => available.includes(key));
  }, [il, ilce]);

  if (availableKeys.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.row}>
        {availableKeys.map((key) => {
          const brand = (BrandColors as any)[key];
          const on = activeBrands.has(key);
          return (
            <Pressable
              key={key}
              {...pressHandlers(() => brandToggle(key))}
              style={[styles.chip, on ? { backgroundColor: brand.color, borderColor: brand.color } : styles.chipOff]}
            >
              <View style={[styles.dot, { backgroundColor: on ? 'rgba(255,255,255,0.8)' : brand.color }]} />
              <Text style={[styles.label, on ? styles.labelOn : styles.labelOff]}>
                {brand.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginTop: 8 },
  row: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipOff: {
    backgroundColor: 'white',
    borderColor: '#D0CCC4',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '500' },
  labelOn: { color: 'white' },
  labelOff: { color: '#666' },
});
