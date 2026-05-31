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
      const hIdx = HOURS.indexOf(h);
      const mIdx = MINUTES.indexOf(m);
      
      setTimeout(() => {
        if (hIdx !== -1) hourRef.current?.scrollToOffset({ offset: hIdx * ITEM_HEIGHT, animated: false });
        if (mIdx !== -1) minRef.current?.scrollToOffset({ offset: mIdx * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [visible]);

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
      <View style={[styles.itemContainer, Platform.OS === 'web' && { scrollSnapAlign: 'center' } as any]}>
        <Animated.Text style={[styles.itemText, { opacity, transform: [{ scale }] }]}>
          {item}
        </Animated.Text>
      </View>
    );
  };

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

        <View style={styles.pickerWrapper}>
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
              decelerationRate={Platform.OS === 'web' ? 0.9 : "fast"}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                if (HOURS[index]) setCurrentHour(HOURS[index]);
              }}
              onScrollEndDrag={(e) => {
                if (Platform.OS === 'web') {
                  const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                  if (HOURS[index]) setCurrentHour(HOURS[index]);
                }
              }}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollYHour } } }], { 
                useNativeDriver: Platform.OS !== 'web',
                listener: (e: any) => {
                  if (Platform.OS === 'web') {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    if (HOURS[index]) setCurrentHour(HOURS[index]);
                  }
                }
              })}
              scrollEventThrottle={16}
              contentContainerStyle={{ 
                paddingVertical: ITEM_HEIGHT * 2,
              }}
              style={Platform.OS === 'web' ? { scrollSnapType: 'y mandatory' } as any : {}}
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
              decelerationRate={Platform.OS === 'web' ? 0.9 : "fast"}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                if (MINUTES[index]) setCurrentMin(MINUTES[index]);
              }}
              onScrollEndDrag={(e) => {
                if (Platform.OS === 'web') {
                  const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                  if (MINUTES[index]) setCurrentMin(MINUTES[index]);
                }
              }}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollYMin } } }], { 
                useNativeDriver: Platform.OS !== 'web',
                listener: (e: any) => {
                  if (Platform.OS === 'web') {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    if (MINUTES[index]) setCurrentMin(MINUTES[index]);
                  }
                }
              })}
              scrollEventThrottle={16}
              contentContainerStyle={{ 
                paddingVertical: ITEM_HEIGHT * 2,
              }}
              style={Platform.OS === 'web' ? { scrollSnapType: 'y mandatory' } as any : {}}
            />
          </View>
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
    paddingHorizontal: 40,
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
  itemContainer: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 22, color: Colors.txt, fontWeight: '600' },
  colon: { fontSize: 22, fontWeight: '700', color: Colors.txt, marginHorizontal: 10 },
});
