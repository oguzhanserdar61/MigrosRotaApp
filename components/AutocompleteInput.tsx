import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '../constants/theme';

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
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{label} Seç</Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder={`${label} ara...`}
                value={query}
                onChangeText={t => { setQuery(t); onChangeText?.(t); }}
                autoFocus
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
                    onPress={() => pick(item.value)}
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
            </View>
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
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: {
    width: '100%',
    zIndex: 2,
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 520,
    paddingBottom: 20,
    zIndex: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: 15, fontWeight: '600', color: Colors.txt },
  closeBtn: { fontSize: 16, color: Colors.txt2, padding: 4 },
  searchInput: {
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    fontSize: 14,
    color: Colors.txt,
  },
  list: { flexGrow: 0, maxHeight: 420 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionPressed: { backgroundColor: Colors.orangeLight },
  optionText: { flex: 1, fontSize: 14, color: Colors.txt },
  optionActive: { color: Colors.orange, fontWeight: '600' },
  optionCount: { fontSize: 12, color: Colors.txt3 },
  sep: { height: 0.5, backgroundColor: Colors.border, marginLeft: 16 },
  emptyText: { textAlign: 'center', padding: 24, color: Colors.txt3, fontSize: 13 },
});
