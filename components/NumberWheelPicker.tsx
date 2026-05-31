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
  title: string;
  value: number | string;
  options: (number | string)[];
  onClose: () => void;
  onSelect: (val: any) => void;
  unit?: string;
}

export function NumberWheelPicker({ visible, title, value, options, onClose, onSelect, unit }: Props) {
  const [currentVal, setCurrentVal] = useState(value);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  
  // İlk açılışta mevcut değere odaklan
  useEffect(() => {
    if (visible) {
      setCurrentVal(value);
      const index = options.indexOf(value);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: index * ITEM_HEIGHT,
            animated: false
          });
        }, 50);
      }
    }
  }, [visible]);

  const updateVal = (y: number) => {
    const index = Math.round(y / ITEM_HEIGHT);
    if (options[index] !== undefined) {
      setCurrentVal(options[index]);
    }
  };

  const handleDone = () => {
    onSelect(currentVal);
    onClose();
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
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
          {item}{unit ? ` ${unit}` : ''}
        </Animated.Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.doneBtn}>Tamam</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pickerContainer}>
          {/* Seçim Çerçevesi */}
          <View style={styles.selectionFrame} pointerEvents="none" />
          
          <Animated.FlatList
            ref={flatListRef}
            data={options}
            renderItem={renderItem}
            keyExtractor={(_, i) => String(i)}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => updateVal(e.nativeEvent.contentOffset.y)}
            onScrollEndDrag={(e) => {
              if (Platform.OS === 'web') updateVal(e.nativeEvent.contentOffset.y);
            }}
            contentContainerStyle={{
              paddingVertical: ITEM_HEIGHT * 2
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { 
                useNativeDriver: Platform.OS !== 'web',
                listener: (e: any) => {
                  if (Platform.OS === 'web') updateVal(e.nativeEvent.contentOffset.y);
                }
              }
            )}
            scrollEventThrottle={16}
          />
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
  pickerContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectionFrame: {
    position: 'absolute',
    width: '90%',
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,103,0,0.05)',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 20,
    color: Colors.txt,
    fontWeight: '600',
  },
});
