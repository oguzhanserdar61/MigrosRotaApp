import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform,
  Animated, PanResponder,
} from 'react-native';
import { Colors } from '../constants/theme';
import { pressHandlers } from '../utils/webPress';

interface Props {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; count?: number }>;
  onSelect: (val: string) => void;
  onChangeText?: (text: string) => void;
}

function toTurkishUpper(text: string) {
  return text
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase();
}

export function AutocompleteInput({ label, value, placeholder, options, onSelect, onChangeText }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
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
      setQuery('');
    });
  };

  const filtered = query
    ? options.filter(o => toTurkishUpper(o.value).includes(toTurkishUpper(query)))
    : options;

  function pick(val: string) {
    setOpen(false);
    setQuery('');
    onSelect(val);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} {...pressHandlers(() => setOpen(true))}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </Pressable>

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
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <Animated.View 
              style={[
                styles.sheet,
                { transform: [{ translateY }] }
              ]}
            >
              {/* Sürüklenebilir Alan / Handle */}
              <View {...panResponder.panHandlers} style={styles.dragArea}>
                <View style={styles.handle} />
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{label} Seç</Text>
                  <Pressable {...pressHandlers(closeModal)} hitSlop={20}>
                    <View style={styles.closeBtnCircle}>
                      <Text style={styles.closeBtn}>✕</Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder={`${label} ara...`}
                value={query}
                onChangeText={t => { setQuery(t); onChangeText?.(t); }}
                autoFocus={false}
                clearButtonMode="while-editing"
              />

              <FlatList
                data={filtered}
                keyExtractor={item => item.value}
                keyboardShouldPersistTaps="always"
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                    {...pressHandlers(() => pick(item.value))}
                  >
                    <Text style={[styles.optionText, item.value === value && styles.optionActive]}>
                      {item.value}
                    </Text>
                    {item.count !== undefined && (
                      <Text style={styles.optionCount}>{item.count}</Text>
                    )}
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>
                    {label === 'İlçe' && !value && options.length === 0 ? 'Önce il seçin' : 'Sonuç bulunamadı'}
                  </Text>
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
  wrapper: { marginBottom: 8 },
  label: { fontSize: 12, color: Colors.txt2, marginBottom: 4, fontWeight: '500' },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  inputText: { flex: 1, fontSize: 13, color: Colors.txt },
  placeholder: { color: Colors.txt3 },
  arrow: { fontSize: 10, color: Colors.txt3 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 80, // Üstten boşluk bırakarak header'ın altında kalmasını sağlar
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: {
    width: '100%',
    zIndex: 2,
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '100%', // modalOverlay padding'i ile sınırlandırılır
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    zIndex: 3,
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
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.txt },
  closeBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: { fontSize: 14, color: Colors.txt2, fontWeight: 'bold' },
  searchInput: {
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 10,
    fontSize: 15,
    color: Colors.txt,
    backgroundColor: '#F9F9F9',
  },
  list: { flexGrow: 0, maxHeight: 420 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionPressed: { backgroundColor: Colors.orangeLight },
  optionText: { flex: 1, fontSize: 15, color: Colors.txt },
  optionActive: { color: Colors.orange, fontWeight: '700' },
  optionCount: { fontSize: 12, color: Colors.txt3 },
  sep: { height: 0.5, backgroundColor: Colors.border, marginLeft: 20 },
  emptyText: { textAlign: 'center', padding: 30, color: Colors.txt3, fontSize: 14 },
});
