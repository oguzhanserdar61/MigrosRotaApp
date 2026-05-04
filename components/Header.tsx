import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../constants/theme';
import { useRotaStore } from '../store/rotaStore';

export function Header() {
  const seciliCount = useRotaStore(s => s.secili.length);

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../migros-seeklogo.png')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
      </View>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>ROTA PLANI v1.1</Text>
      </View>
      {seciliCount > 0 && (
        <View style={styles.selBadge}>
          <Text style={styles.selBadgeText}>{seciliCount} seçili</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoContainer: {
    width: 100,
    height: 35,
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    tintColor: 'white',
  },
  headerInfo: { 
    flex: 1, 
    alignItems: 'flex-end',
  },
  headerTitle: { 
    color: 'white', 
    fontWeight: '800', 
    fontSize: 22, 
    letterSpacing: 0.5 
  },
  selBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  selBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
});
