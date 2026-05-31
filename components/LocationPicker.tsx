import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, PanResponder,
} from 'react-native';
import { Colors } from '../constants/theme';
import { searchStores } from '../utils/magazaData';
import { pressHandlers } from '../utils/webPress';

interface LocationItem {
  lat: number;
  lng: number;
  label: string;
  sub?: string;
  isStore?: boolean;
  il?: string;
  ilce?: string;
}

interface Props {
  label: string;
  value: { label: string; il?: string; ilce?: string } | null;
  placeholder: string;
  onSelect: (item: LocationItem | null) => void;
}

export function LocationPicker({ label, value, placeholder, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal kapandığında state temizle
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.5) {
          closeModal();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (open) {
      translateY.setValue(400); // Başlangıçta aşağıda
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }).start();
    }
  }, [open]);

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: 600,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setOpen(false);
    });
  };

  async function search(q: string) {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    timer.current = setTimeout(async () => {
    setLoading(true);
    try {
      // 1. Mağazalarda ara
      const stores: LocationItem[] = searchStores(q).map(s => ({
        lat: s[1],
        lng: s[2],
        label: s[4],
        sub: s[3],
        isStore: true,
        il: s[5],
        ilce: s[7],
      }));

      // 2. Photon API (OpenStreetMap)
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=tr&bbox=25.6,35.8,44.8,42.1`);
      const data = await res.json();
      const locations: LocationItem[] = (data.features || []).map((f: any) => {
        const p = f.properties;
        const [lng, lat] = f.geometry.coordinates;
        return {
          lat,
          lng,
          label: [p.name, p.street, p.housenumber].filter(Boolean).join(' '),
          sub: [p.district || p.city || p.county, p.state || 'Türkiye'].filter(Boolean).join(', '),
          isStore: false,
          il: (p.state || p.city || '').toUpperCase(),
          ilce: (p.district || p.county || '').toUpperCase(),
        };
      });

      setResults([...stores, ...locations]);
    } catch (e) {

        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function pick(item: LocationItem) {
    onSelect(item);
    setOpen(false);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Pressable 
          style={styles.input} 
          {...pressHandlers(() => setOpen(true))}
          hitSlop={8}
        >
          <Text style={[styles.inputText, !value && styles.placeholder]} numberOfLines={1}>
            {value?.label || placeholder}
          </Text>
        </Pressable>
        {value && (
          <Pressable style={styles.clearBtn} {...pressHandlers(() => onSelect(null))} hitSlop={8}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      <Modal 
        visible={open} 
        transparent 
        animationType="fade" 
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={closeModal} 
          />
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            <Animated.View 
              style={[
                styles.sheet,
                { transform: [{ translateY }] }
              ]}
            >
              <View {...panResponder.panHandlers} style={styles.dragArea}>
                <View style={styles.handle} />
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{label} Seç</Text>
                  <TouchableOpacity onPress={closeModal} hitSlop={20}>
                    <View style={styles.closeBtnCircle}>
                      <Text style={styles.closeBtn}>✕</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.searchBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Mağaza veya adres ara..."
                  value={query}
                  onChangeText={search}
                  autoFocus={false}
                  clearButtonMode="while-editing"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {loading && <ActivityIndicator style={styles.loader} color={Colors.orange} />}
              </View>

              <FlatList
                data={results}
                keyExtractor={(item, i) => `${item.lat}-${item.lng}-${i}`}
                keyboardShouldPersistTaps="always"
                style={styles.list}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <Pressable style={styles.option} {...pressHandlers(() => pick(item))}>
                    <View style={styles.optionIconBox}>
                      <Text style={styles.optionIcon}>{item.isStore ? '🏪' : '📍'}</Text>
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionLabel} numberOfLines={1}>{item.label}</Text>
                      <Text style={styles.optionSub} numberOfLines={1}>{item.sub}</Text>
                    </View>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                ListEmptyComponent={() => (
                  query.trim().length >= 2 && !loading ? (
                    <Text style={styles.noResult}>Sonuç bulunamadı</Text>
                  ) : (
                    <Text style={styles.hint}>En az 2 karakter girin...</Text>
                  )
                )}
              />
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 10 },
  label: { fontSize: 12, color: Colors.txt2, marginBottom: 4, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 6 },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    backgroundColor: 'white',
    minHeight: 40,
  },
  inputText: { flex: 1, fontSize: 13, color: Colors.txt },
  placeholder: { color: Colors.txt3 },
  clearBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  clearText: { color: Colors.txt3, fontSize: 14 },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  backdrop: { 
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Platform.OS === 'ios' ? '80%' : '75%',
    maxHeight: '100%',
    paddingBottom: 20,
  },
  dragArea: {
    paddingTop: 10,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD',
    marginBottom: 5,
  },
  sheetHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.txt },
  closeBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: { fontSize: 14, color: Colors.txt2, fontWeight: 'bold' },
  
  searchBox: { 
    padding: 14,
    position: 'relative',
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 10,
    fontSize: 16,
    color: Colors.txt,
    backgroundColor: '#F9F9F9',
  },
  loader: { position: 'absolute', right: 26, top: 26 },
  
  list: { flex: 1 },
  listContent: { paddingBottom: 40 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 12 },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: { fontSize: 18 },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.txt },
  optionSub: { fontSize: 12, color: Colors.txt2, marginTop: 2 },
  sep: { height: 0.5, backgroundColor: Colors.border, marginLeft: 63 },
  noResult: { textAlign: 'center', padding: 30, color: Colors.txt3, fontSize: 14 },
  hint: { textAlign: 'center', padding: 30, color: Colors.txt3, fontSize: 13 },
});
