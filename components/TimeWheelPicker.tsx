import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, Dimensions, Animated, Platform
} from 'react-native';
import { Colors } from '../constants/theme';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

interface Props {
  visible: boolean;
  value: string; // "HH:MM"
  onClose: () => void;
  onSelect: (val: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export function TimeWheelPicker({ visible, value, onClose, onSelect }: Props) {
  const [currentHour, setCurrentHour] = useState(value.split(':')[0] || '09');
  const [currentMin, setCurrentMin] = useState(value.split(':')[1] || '00');
  
  const scrollYHour = useRef(new Animated.Value(0)).current;
  const scrollYMin = useRef(new Animated.Value(0)).current;
  
  const hourRef = useRef<FlatList>(null);
  const minRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      const [h, m] = value.split(':');
      setCurrentHour(h);
      setCurrentMin(m);

      if (Platform.OS !== 'web') {
        const hIdx = HOURS.indexOf(h);
        const mIdx = MINUTES.indexOf(m);
        setTimeout(() => {
          if (hIdx !== -1) hourRef.current?.scrollToOffset({ offset: hIdx * ITEM_HEIGHT, animated: false });
          if (mIdx !== -1) minRef.current?.scrollToOffset({ offset: mIdx * ITEM_HEIGHT, animated: false });
        }, 50);
      }
    }
  }, [visible, value]);

  const handleDone = () => {
    onSelect(`${currentHour}:${currentMin}`);
    onClose();
  };

  const renderItem = (scrollY: any) => ({ item, index }: { item: any; index: number }) => {
    const inputRange = [
      (index - 2) * ITEM_HEIGHT,
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
      (index + 2) * ITEM_HEIGHT,
    ];

    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.3, 0.6, 1, 0.6, 0.3],
      extrapolate: 'clamp',
    });

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.8, 0.9, 1.1, 0.9, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.itemContainer}>
        <Animated.Text style={[styles.itemText, { opacity, transform: [{ scale }] }]}>
          {item}
        </Animated.Text>
      </View>
    );
  };

  const renderWebList = (data: string[], current: string, setter: (v: string) => void, title: string) => (
    <View style={styles.webWheelBox}>
      <Text style={styles.webWheelTitle}>{title}</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => {
          const isSelected = item === current;
          return (
            <TouchableOpacity
              style={[styles.webItem, isSelected && { backgroundColor: 'rgba(255,103,0,0.1)' }]}
              onPress={() => setter(item)}
            >
              <Text style={[styles.itemText, isSelected && { color: Colors.orange, fontWeight: '700' }]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={item => item}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Başlangıç Saati</Text>
          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.doneBtn}>Tamam</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.pickerWrapper, Platform.OS === 'web' && { height: 300 }]}>
          {Platform.OS === 'web' ? (
            <View style={styles.webWrapper}>
              {renderWebList(HOURS, currentHour, setCurrentHour, "Saat")}
              <Text style={styles.colon}>:</Text>
              {renderWebList(MINUTES, currentMin, setCurrentMin, "Dakika")}
            </View>
          ) : (
            <>
              <View style={styles.selectionFrame} pointerEvents="none" />
              <View style={styles.wheelBox}>
                <Animated.FlatList
                  ref={hourRef}
                  data={HOURS}
                  renderItem={renderItem(scrollYHour)}
                  keyExtractor={(_, i) => `h-${i}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    if (HOURS[index]) setCurrentHour(HOURS[index]);
                  }}
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollYHour } } }], { useNativeDriver: true })}
                  contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                />
              </View>
              <Text style={styles.colon}>:</Text>
              <View style={styles.wheelBox}>
                <Animated.FlatList
                  ref={minRef}
                  data={MINUTES}
                  renderItem={renderItem(scrollYMin)}
                  keyExtractor={(_, i) => `m-${i}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    if (MINUTES[index]) setCurrentMin(MINUTES[index]);
                  }}
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollYMin } } }], { useNativeDriver: true })}
                  contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.txt },
  doneBtn: { fontSize: 15, fontWeight: '700', color: Colors.orange },
  pickerWrapper: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  selectionFrame: {
    position: 'absolute',
    width: '100%',
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,103,0,0.05)',
  },
  wheelBox: { flex: 1, height: '100%' },
  webWrapper: { flexDirection: 'row', flex: 1, height: '100%' },
  webWheelBox: { flex: 1, height: '100%' },
  webWheelTitle: { fontSize: 12, color: Colors.txt2, textAlign: 'center', marginVertical: 5, fontWeight: '600' },
  itemContainer: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  webItem: {
    height: ITEM_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  itemText: { fontSize: 20, color: Colors.txt, fontWeight: '600' },
  colon: { fontSize: 22, fontWeight: '700', color: Colors.txt, marginHorizontal: 10, alignSelf: 'center' },
});
