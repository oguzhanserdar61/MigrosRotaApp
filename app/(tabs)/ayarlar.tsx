import React, { useState } from 'react';
import {
  View, Text, Pressable,
  ScrollView, StyleSheet, TextInput, Linking, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useRotaStore } from '../../store/rotaStore';
import { NumberWheelPicker } from '../../components/NumberWheelPicker';
import { TimeWheelPicker } from '../../components/TimeWheelPicker';
import { Header } from '../../components/Header';
import { DB, getIller } from '../../utils/magazaData';
import { pressHandlers } from '../../utils/webPress';

export default function AyarlarScreen() {
  const {
    tur, turGuncelle,
  } = useRotaStore();

  const [showTime, setShowTime] = useState(false);
  const [showMins, setShowMins] = useState(false);
  const [showTarget, setShowTarget] = useState(false);
  const [showMaxTime, setShowMaxTime] = useState(false);
  const [feedback, setFeedback] = useState('');

  const minOptions = Array.from({ length: 24 }, (_, i) => (i + 1) * 5); // 5, 10, ..., 120
  const targetOptions = Array.from({ length: 20 }, (_, i) => i + 1); // 1-20
  const maxTimeOptions = Array.from({ length: 16 }, (_, i) => i + 1); // 1-16
  const toplamMagaza = Object.values(DB).reduce((sum, stores) => sum + stores.length, 0);
  const toplamIl = getIller().length;

  const handleSendFeedback = () => {
    if (!feedback.trim()) {
      const msg = 'Lütfen bir mesaj yazın.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Uyarı', msg);
      return;
    }

    const subject = encodeURIComponent('Migros Rota Uygulaması - Görüş ve Öneri');
    const body = encodeURIComponent(feedback);
    const mailtoUrl = `mailto:oguzhan.serdar@migros.com.tr?subject=${subject}&body=${body}`;

    Linking.openURL(mailtoUrl).catch(() => {
      const msg = 'E-posta uygulaması açılamadı.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Hata', msg);
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Tur Parametreleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tur Parametreleri</Text>

          <View style={styles.row2}>
            <Pressable style={styles.half} {...pressHandlers(() => setShowTime(true))}>
              <Text style={styles.fieldLabel}>Başlangıç saati</Text>
              <View style={styles.pickerTrigger}>
                <Text style={styles.pickerVal}>{tur.baslangicSaati}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.half} {...pressHandlers(() => setShowMins(true))}>
              <Text style={styles.fieldLabel}>Mağaza Ziyaret Süresi (dk)</Text>
              <View style={styles.pickerTrigger}>
                <Text style={styles.pickerVal}>{tur.magazaBasiDakika} dk</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.row2}>
            <Pressable style={styles.half} {...pressHandlers(() => setShowTarget(true))}>
              <Text style={styles.fieldLabel}>Hedef mağaza</Text>
              <View style={styles.pickerTrigger}>
                <Text style={styles.pickerVal}>{tur.hedefMagaza} mağaza</Text>
              </View>
            </Pressable>
            <Pressable style={styles.half} {...pressHandlers(() => setShowMaxTime(true))}>
              <Text style={styles.fieldLabel}>Maksimum Süre (Saat)</Text>
              <View style={styles.pickerTrigger}>
                <Text style={styles.pickerVal}>{tur.maksSaat} saat</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Görüş ve Öneriler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görüş ve Öneriler</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Görüş, öneri veya hata bildirimlerinizi buraya yazabilirsiniz..."
            placeholderTextColor={Colors.txt3}
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
            textAlignVertical="top"
          />
          <Pressable style={styles.sendBtn} {...pressHandlers(handleSendFeedback)}>
            <Text style={styles.sendBtnText}>Gönder</Text>
          </Pressable>
        </View>

        {/* Uygulama hakkında */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hakkında</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Veri kaynağı</Text>
            <Text style={styles.aboutVal}>Magaza_Listesi.xlsx</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Toplam mağaza</Text>
            <Text style={styles.aboutVal}>{toplamMagaza.toLocaleString('tr')}</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Kapsanan il</Text>
            <Text style={styles.aboutVal}>{toplamIl.toLocaleString('tr')}</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Algoritma</Text>
            <Text style={styles.aboutVal}>Nearest Neighbor + 2-opt</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Yardım ve destek için <Text style={styles.footerHighlight}>Oğuzhan Serdar</Text> ile iletişim kurabilirsiniz.
          </Text>
        </View>

      </ScrollView>

      {/* Pickers */}
      <TimeWheelPicker
        visible={showTime}
        value={tur.baslangicSaati}
        onClose={() => setShowTime(false)}
        onSelect={v => turGuncelle({ baslangicSaati: v })}
      />

      <NumberWheelPicker
        visible={showMins}
        title="Mağaza Başı Süre"
        value={tur.magazaBasiDakika}
        options={minOptions}
        unit="dk"
        onClose={() => setShowMins(false)}
        onSelect={v => turGuncelle({ magazaBasiDakika: v })}
      />

      <NumberWheelPicker
        visible={showTarget}
        title="Hedef Mağaza Sayısı"
        value={tur.hedefMagaza}
        options={targetOptions}
        onClose={() => setShowTarget(false)}
        onSelect={v => turGuncelle({ hedefMagaza: v })}
      />

      <NumberWheelPicker
        visible={showMaxTime}
        title="Maksimum Tur Süresi"
        value={tur.maksSaat}
        options={maxTimeOptions}
        unit="saat"
        onClose={() => setShowMaxTime(false)}
        onSelect={v => turGuncelle({ maksSaat: v })}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.txt2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  half: { flex: 1 },
  fieldLabel: { fontSize: 11, color: Colors.txt2, marginBottom: 4, fontWeight: '500' },
  pickerTrigger: {
    height: 38,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    fontSize: 14,
    color: Colors.txt,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  pickerVal: {
    fontSize: 14,
    color: Colors.txt,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  aboutKey: { fontSize: 13, color: Colors.txt2 },
  aboutVal: { fontSize: 13, color: Colors.txt, fontWeight: '500' },
  feedbackInput: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: Colors.txt,
    minHeight: 100,
    marginBottom: 10,
  },
  sendBtn: {
    backgroundColor: Colors.orange,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.txt3,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerHighlight: {
    color: Colors.txt,
    fontWeight: '600',
  },
});
