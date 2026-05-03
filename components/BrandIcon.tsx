import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBrand } from '../constants/theme';

interface Props {
  brandCode: string;
  size?: number;
  inverted?: boolean;
}

export function BrandIcon({ brandCode, size = 28, inverted = false }: Props) {
  const brand = getBrand(brandCode);
  return (
    <View style={[
      styles.container,
      { width: size, height: size, borderRadius: size / 5 },
      inverted ? { backgroundColor: 'white', borderWidth: 1.5, borderColor: brand.color } : { backgroundColor: brand.color },
    ]}>
      <Text style={[
        styles.text,
        { fontSize: size * 0.35 },
        inverted ? { color: brand.color } : { color: 'white' },
      ]}>
        {brand.short}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
