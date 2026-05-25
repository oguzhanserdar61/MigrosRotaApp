import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, Platform,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { AutocompleteInput } from '../../components/AutocompleteInput';
import { BrandFilter } from '../../components/BrandFilter';
import { MagazaKarti } from '../../components/MagazaKarti';
import { MagazaDetay } from '../../components/MagazaDetay';
import { Header } from '../../components/Header';
import { Colors } from '../../constants/theme';
import { useFilterStore } from '../../store/filterStore';
import { useRotaStore } from '../../store/rotaStore';
import { DB, filterStores, getIller, getIlceler } from '../../utils/magazaData';
import type { StoreRow } from '../../utils/magazaData';
import { pressHandlers } from '../../utils/webPress';

import { LocationPicker } from '../../components/LocationPicker';

export default function MagazalarScreen() {
  const { il, ilce, search, activeBrands, ilAyarla, ilceAyarla, searchAyarla, sifirla } = useFilterStore();
  const { 
    secili, startPoint, endPoint,
    startPointAyarla, endPointAyarla 
  } = useRotaStore();
  const [detayRow, setDetayRow] = useState<StoreRow | null>(null);
  const [pointMode, setPointMode] = useState<'ozel' | 'yok'>('ozel');

  const iller = useMemo(() =>
    getIller().map(v => ({ value: v, count: (DB[v] ?? []).length })),
    []
  );

  const ilceler = useMemo(() =>
    il ? getIlceler(il).map(v => ({
      value: v,
      count: (DB[il] ?? []).filter(s => s[7] === v).length,
    })) : [],
    [il]
  );

  const filtered = useMemo(() =>
    filterStores(il, ilce, search, activeBrands),
    [il, ilce, search, activeBrands]
  );

  const renderItem = useCallback(({ item, index }: { item: StoreRow; index: number }) => {
    const isSelected = secili.some(m => m[0] === item[0]);
    const isFirst = secili.length > 0 && secili[0][0] === item[0];
    const selIndex = secili.findIndex(m => m[0] === item[0]);

    return (
      <MagazaKarti
        row={item}
        index={index}
        isSelected={isSelected}
        isFirst={isFirst}
        selIndex={selIndex}
        onPress={() => setDetayRow(item)}
      />
    );
  }, [secili]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={Colors.orange} barStyle="light-content" />

      <Header />

      {/* Filtreler */}
      <View style={styles.filters}>
        <View style={styles.filterRow}>
          <View style={styles.filterHalf}>
            <AutocompleteInput
              label="İl"
              value={il}
              placeholder="İl seçin..."
              options={iller}
              onSelect={ilAyarla}
            />
          </View>
          <View style={styles.filterHalf}>
            <AutocompleteInput
              label="İlçe"
              value={ilce}
              placeholder="İlçe seçin..."
              options={ilceler}
              onSelect={ilceAyarla}
            />
          </View>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Mağaza adı ara..."
            placeholderTextColor={Colors.txt3}
            value={search}
            onChangeText={searchAyarla}
            clearButtonMode="while-editing"
          />
          <Pressable style={styles.resetBtn} {...pressHandlers(sifirla)}>
            <Text style={styles.resetText}>✕ Sıfırla</Text>
          </Pressable>
        </View>

        {/* Başlangıç ve Bitiş Noktaları */}
        <View style={styles.pointsArea}>
          <Text style={styles.pointsTitle}>Başlangıç ve Bitiş Noktası Belirle</Text>
          <View style={styles.pointBtns}>
            <Pressable 
              style={[styles.pointBtn, pointMode === 'ozel' && styles.pointBtnActive]} 
              {...pressHandlers(() => setPointMode('ozel'))}
            >
              <Text style={[styles.pointBtnText, pointMode === 'ozel' && styles.pointBtnActiveText]}>Özel</Text>
            </Pressable>
            <Pressable 
              style={[styles.pointBtn, pointMode === 'yok' && styles.pointBtnActive]} 
              {...pressHandlers(() => { 
                setPointMode('yok');
                startPointAyarla(null); 
                endPointAyarla(null); 
              })}
            >
              <Text style={[styles.pointBtnText, pointMode === 'yok' && styles.pointBtnActiveText]}>Yok</Text>
            </Pressable>
          </View>

          {pointMode === 'ozel' && (
            <View style={{ marginTop: 12, gap: 10 }}>
              <LocationPicker
                label="Başlangıç Noktası"
                value={startPoint}
                placeholder="Konum veya mağaza seçin..."
                onSelect={startPointAyarla}
              />
              
              <View>
                <View style={styles.labelRow}>
                  <Text style={styles.pickerLabel}>Bitiş Noktası</Text>
                  <Pressable 
                    {...pressHandlers(() => {
                      if (startPoint) {
                        endPointAyarla(startPoint);
                      } else {
                        Alert.alert('Uyarı', 'Lütfen Başlangıç Noktası Seçiniz.');
                      }
                    })}
                  >
                    <Text style={styles.returnBtn}>↺ Başlangıca Dön</Text>
                  </Pressable>
                </View>
                <LocationPicker
                  label=""
                  value={endPoint}
                  placeholder="Konum veya mağaza seçin..."
                  onSelect={endPointAyarla}
                />
              </View>
            </View>
          )}
        </View>

        <BrandFilter />
      </View>

      {/* Liste sayacı */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>{filtered.length.toLocaleString('tr')} mağaza listelendi</Text>
      </View>

      {/* Mağaza listesi */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          <Text style={styles.emptyHint}>Filtreleri değiştirmeyi deneyin</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {Platform.OS === 'web' ? (
            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={item => item[0]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          ) : (
            <FlashList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={item => item[0]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      )}

      {/* Mağaza detay modal */}
      <MagazaDetay row={detayRow} onClose={() => setDetayRow(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  filters: {
    backgroundColor: 'white',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  filterHalf: { flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  searchInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    fontSize: 13,
    color: Colors.txt,
    backgroundColor: 'white',
  },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'white',
  },
  resetText: { fontSize: 11, color: Colors.txt2, fontWeight: '500' },
  pointsArea: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    marginBottom: 8,
  },
  pointsTitle: {
    fontSize: 10,
    color: Colors.txt3,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  pointBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  pointBtnActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  pointBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.txt2,
  },
  pointBtnActiveText: {
    color: 'white',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickerLabel: {
    fontSize: 12,
    color: Colors.txt2,
    fontWeight: '600',
  },
  returnBtn: {
    fontSize: 11,
    color: Colors.orange,
    fontWeight: '600',
  },
  countBar: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  countText: { fontSize: 11, color: Colors.txt3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.txt2 },
  emptyHint: { fontSize: 12, color: Colors.txt3 },
});
