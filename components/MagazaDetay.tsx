import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { Colors, getBrand } from '../constants/theme';
import { BrandIcon } from './BrandIcon';
import { useRotaStore } from '../store/rotaStore';
import { hasValidCoords, type StoreRow } from '../utils/magazaData';

interface Props {
  row: StoreRow | null;
  onClose: () => void;
}

function openExternalUrl(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  Linking.openURL(url);
}

export function MagazaDetay({ row, onClose }: Props) {
  const { secili, toggleSecim } = useRotaStore();
  if (!row) return null;
  const store: StoreRow = row;

  const [id, lat, lng, adres, isim, telefon, brandCode, , format, acilisTarihi, satisM2, genelM2] = store;
  const brand = getBrand(brandCode);
  const isSelected = secili.some(m => m[0] === id);
  const validCoords = hasValidCoords(store);

  function haritaAc() {
    if (!validCoords) {
      Alert.alert('Koordinat eksik', 'Bu mağaza için harita konumu bulunmuyor.');
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const appleMapsUrl = `maps://0,0?q=${encodeURIComponent(isim)}&ll=${lat},${lng}`;

    if (Platform.OS === 'web') {
      openExternalUrl(googleMapsUrl);
      return;
    }

    Alert.alert(
      'Haritada Gör',
      'Hangi uygulama ile açmak istersiniz?',
      [
        { text: 'Google Maps', onPress: () => openExternalUrl(googleMapsUrl) },
        { text: 'Apple Haritalar', onPress: () => openExternalUrl(appleMapsUrl) },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  }

  function aramaYap() {
    if (telefon) Linking.openURL(`tel:0${telefon.slice(3)}`);
  }

  function rotaSeciminiDegistir() {
    if (!validCoords && !isSelected) {
      Alert.alert('Koordinat eksik', 'Koordinatı olmayan mağazalar rotaya eklenemez.');
      return;
    }

    toggleSecim(store);
    onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <BrandIcon brandCode={brandCode} size={36} />
          <View style={styles.headerInfo}>
            <Text style={styles.isim} numberOfLines={2}>{isim}</Text>
            <View style={[styles.badge, { backgroundColor: brand.bg }]}>
              <Text style={[styles.badgeText, { color: brand.tc }]}>{brand.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rows}>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Format</Text>
            <Text style={styles.rowVal}>{format || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Açılış Tarihi</Text>
            <Text style={styles.rowVal}>{acilisTarihi || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Satış Alanı (metrekare)</Text>
            <Text style={styles.rowVal}>{satisM2 || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Genel Alan (metrekare)</Text>
            <Text style={styles.rowVal}>{genelM2 || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Adres</Text>
            <Text style={styles.rowVal} numberOfLines={3}>{adres}</Text>
          </View>
          {telefon ? (
            <Pressable style={styles.row} onPress={aramaYap}>
              <Text style={styles.rowKey}>Telefon</Text>
              <Text style={[styles.rowVal, styles.link]}>0{telefon.slice(3)}</Text>
            </Pressable>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.rowKey}>Koordinat</Text>
            <Text style={styles.rowVal}>{validCoords ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : '-'}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.btnMap, !validCoords && styles.btnDisabled]} onPress={haritaAc}>
            <Text style={styles.btnMapText}>🗺 Haritada Gör</Text>
          </Pressable>
          <Pressable
            style={[styles.btnAdd, isSelected && styles.btnAdded, !validCoords && !isSelected && styles.btnDisabled]}
            onPress={rotaSeciminiDegistir}
          >
            <Text style={styles.btnAddText}>
              {isSelected ? '✓ Rotadan Çıkar' : validCoords ? '+ Rotaya Ekle' : 'Koordinat Yok'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  headerInfo: { flex: 1, gap: 6 },
  isim: { fontSize: 15, fontWeight: '700', color: Colors.txt },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  rows: { gap: 0, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  rowKey: { fontSize: 12, color: Colors.txt2, width: 70 },
  rowVal: { flex: 1, fontSize: 12, color: Colors.txt, textAlign: 'right', fontWeight: '500' },
  link: { color: Colors.orange },
  actions: { flexDirection: 'row', gap: 10 },
  btnMap: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
  },
  btnMapText: { fontSize: 13, color: Colors.txt, fontWeight: '500' },
  btnAdd: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.orange,
    alignItems: 'center',
  },
  btnAdded: { backgroundColor: '#1A7F4B' },
  btnDisabled: { opacity: 0.45 },
  btnAddText: { fontSize: 13, color: 'white', fontWeight: '600' },
});
