import React, { useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView,
  StyleSheet, Linking, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useRotaStore } from '../../store/rotaStore';
import { BrandIcon } from '../../components/BrandIcon';
import { Header } from '../../components/Header';
import { haversine } from '../../utils/haversine';
import { pressHandlers } from '../../utils/webPress';

function fmtTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function StatKart({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.statKart}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statVal}>
        {value}
        {unit && <Text style={styles.statUnit}> {unit}</Text>}
      </Text>
    </View>
  );
}

function openExternalUrl(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  Linking.openURL(url);
}

export default function RotaScreen() {
  const {
    secili, startPoint, endPoint, tur,
    optimizeEdildi, toplamKm,
    rotayiOlustur, rotayiSifirla, secimTemizle,
    toggleSecim,
  } = useRotaStore();

  const { duraklar, travelMins } = useMemo(() => {
    const [sh, sm] = tur.baslangicSaati.split(':').map(Number);
    let currentMins = sh * 60 + sm;
    let totalTravelMins = 0;
    
    const results: any[] = [];
    const uniqueIller = new Set(secili.map(s => s[5]));
    const ilCount = uniqueIller.size;

    const getSegmentMins = (s1: any, s2: any, dist: number) => {
      const r1 = s1?.row;
      const r2 = s2?.row;

      // İl/İlçe bilgilerini al (Eğer row varsa oradan, yoksa s1/s2'den - startPoint/endPoint durumu)
      const il1 = r1 ? r1[5] : s1?.il;
      const ilce1 = r1 ? r1[7] : s1?.ilce;
      const il2 = r2 ? r2[5] : s2?.il;
      const ilce2 = r2 ? r2[7] : s2?.ilce;

      // Eğer il bilgisi hiç yoksa (serbest adres) sabit bir hız (40 km/s) kullan
      if (!il1 || !il2) return dist * 1.5;

      if (il1 === il2) {
        if (ilce1 === ilce2) {
          // Aynı ilçe: 15 km/s (4.0 dk/km)
          return dist * 4.0;
        } else {
          // Aynı il farklı ilçe: İlk ve son 2'şer km 15 km/s, geri kalan 22 km/s (2.73 dk/km)
          const slowDist = Math.min(dist, 4);
          const fastDist = Math.max(0, dist - 4);
          return (slowDist * 4.0) + (fastDist * 2.73);
        }
      } else {
        // Farklı il
        const fastMult = ilCount >= 3 ? 0.6 : 1.0; // 100 km/s veya 60 km/s
        // Şehirler arası: İlk ve son 5'er km şehir içi hızı (22 km/s), geri kalan ana yol hızı
        const urbanDist = Math.min(dist, 10);
        const highwayDist = Math.max(0, dist - 10);
        return (urbanDist * 2.73) + (highwayDist * fastMult);
      }
    };

    // Başlangıç noktası varsa ilk durak odur
    if (startPoint) {
      results.push({
        isPoint: true,
        label: startPoint.label,
        il: startPoint.il,
        ilce: startPoint.ilce,
        arr: fmtTime(currentMins),
        dep: fmtTime(currentMins),
        lat: startPoint.lat,
        lng: startPoint.lng,
        type: 'start'
      });
    }

    secili.forEach((row, i) => {
      let prevLat, prevLng, prevDurak;
      if (i === 0) {
        if (startPoint) {
          prevDurak = results[0];
          prevLat = startPoint.lat;
          prevLng = startPoint.lng;
        } else {
          // Başlangıç noktası yoksa ilk mağaza saati baz alınır
          results.push({
            row,
            arr: fmtTime(currentMins),
            dep: fmtTime(currentMins + tur.magazaBasiDakika)
          });
          currentMins += tur.magazaBasiDakika;
          return;
        }
      } else {
        prevDurak = results[results.length - 1];
        prevLat = secili[i-1][1];
        prevLng = secili[i-1][2];
      }

      // Yol süresi
      const dist = haversine(prevLat!, prevLng!, row[1], row[2]);
      const travel = Math.round(getSegmentMins(prevDurak, { row }, dist));
      totalTravelMins += travel;
      currentMins += travel; 
      
      const arr = fmtTime(currentMins);
      currentMins += tur.magazaBasiDakika;
      const dep = fmtTime(currentMins);
      
      results.push({ row, arr, dep });
    });

    // Bitiş noktası varsa ekle
    if (endPoint && (secili.length > 0 || startPoint)) {
      let prevLat, prevLng, prevDurak;
      if (secili.length > 0) {
        prevDurak = results[results.length - 1];
        const last = secili[secili.length - 1];
        prevLat = last[1];
        prevLng = last[2];
      } else {
        prevDurak = results[0];
        prevLat = startPoint!.lat;
        prevLng = startPoint!.lng;
      }
      
      const dist = haversine(prevLat, prevLng, endPoint.lat, endPoint.lng);
      const travel = Math.round(getSegmentMins(prevDurak, { isPoint: true }, dist));
      totalTravelMins += travel;
      currentMins += travel;

      results.push({
        isPoint: true,
        label: endPoint.label,
        arr: fmtTime(currentMins),
        dep: fmtTime(currentMins),
        lat: endPoint.lat,
        lng: endPoint.lng,
        type: 'end'
      });
    }

    return { duraklar: results, travelMins: totalTravelMins };
  }, [secili, tur, startPoint, endPoint]);

  const stats = useMemo(() => {
    if (!duraklar.length) return { total: '0 dk', travel: '0 dk' };
    
    const [sh, sm] = tur.baslangicSaati.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const last = duraklar[duraklar.length - 1];
    const [lh, lm] = last.dep.split(':').map(Number);
    const endMins = lh * 60 + lm;
    const totalMins = endMins - startMins;

    const fmt = (m: number) => {
      const hours = Math.floor(m / 60);
      const mins = m % 60;
      if (hours === 0) return `${mins} dakika`;
      return `${hours} saat ${mins} dakika`;
    };

    return {
      total: fmt(totalMins),
      travel: fmt(travelMins),
      totalMins
    };
  }, [duraklar, tur, travelMins]);

  // Maksimum süre kontrolü
  React.useEffect(() => {
    if (optimizeEdildi && stats.totalMins > tur.maksSaat * 60) {
      const msg = `Dikkat: Toplam rota süresi (${stats.total}) ayarlarda belirlediğiniz maksimum süreyi (${tur.maksSaat} saat) aşıyor.`;
      if (Platform.OS === 'web') {
        alert(`Süre Sınırı Aşıldı\n\n${msg}`);
      } else {
        Alert.alert('Süre Sınırı Aşıldı', msg);
      }
    }
  }, [optimizeEdildi, stats.totalMins, tur.maksSaat, stats.total]);


  function haritadaGoster() {
    const coords: string[] = [];
    if (startPoint) coords.push(`${startPoint.lat},${startPoint.lng}`);
    secili.forEach(s => coords.push(`${s[1]},${s[2]}`));
    if (endPoint) coords.push(`${endPoint.lat},${endPoint.lng}`);
    
    if (coords.length < 2) return;

    const origin = coords[0];
    const destination = coords[coords.length - 1];
    const waypoints = coords.slice(1, -1);

    const openGoogle = () => {
      let url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}`;
      waypoints.forEach(w => { url += `/${encodeURIComponent(w)}`; });
      url += `/${encodeURIComponent(destination)}`;
      openExternalUrl(url);
    };

    const openApple = () => {
      // Apple Maps multi-stop: saddr=origin&daddr=wp1+to:wp2+to:dest
      const daddrParts = waypoints.map(w => encodeURIComponent(w));
      daddrParts.push(encodeURIComponent(destination));
      const url = `http://maps.apple.com/?saddr=${encodeURIComponent(origin)}&daddr=${daddrParts.join('+to:')}&dirflg=d`;
      openExternalUrl(url);
    };

    if (Platform.OS === 'web') {
      openGoogle();
      return;
    }

    Alert.alert(
      'Haritada Göster',
      'Hangi uygulama ile açmak istersiniz?',
      [
        { text: 'Google Maps', onPress: openGoogle },
        { text: 'Apple Haritalar', onPress: openApple },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  }

  if (secili.length === 0 && !startPoint && !endPoint) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Header />
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>Henüz rota oluşturulmadı</Text>
          <Text style={styles.emptyHint}>Mağazalar sekmesinden seçim yapın</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* İstatistikler */}
        <View style={styles.statsGrid}>
          <StatKart label="Seçili" value={String(secili.length)} unit="mağaza" />
          <StatKart label="Mesafe" value={String(toplamKm)} unit="km" />
          <StatKart
            label="Bitiş"
            value={duraklar.length > 0 ? duraklar[duraklar.length - 1].dep : '--:--'}
          />
          <StatKart label="Toplam Süre" value={stats.total} />
          <StatKart label="Yolda Geçen" value={stats.travel} />
        </View>

        {/* Rota oluştur butonu */}
        {!optimizeEdildi && secili.length >= 2 && (
          <View style={styles.section}>
            <Pressable style={styles.btnOptimize} {...pressHandlers(rotayiOlustur)}>
              <Text style={styles.btnOptimizeText}>✦ Rotayı Optimize Et</Text>
              <Text style={styles.btnOptimizeSub}>En kısa yol · 2-opt algoritması</Text>
            </Pressable>
          </View>
        )}

        {optimizeEdildi && (
          <View style={[styles.section, styles.optimizeInfo]}>
            <Text style={styles.optimizeInfoText}>✓ Rota optimize edildi · {toplamKm} km</Text>
          </View>
        )}

        {/* Durak listesi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Durak Sırası</Text>
          {duraklar.map((durak, i) => {
            const hasNext = i < duraklar.length - 1;

            if (durak.isPoint) {
              return (
                <View key={`${durak.type}-${i}`} style={styles.durak}>
                  <View style={styles.timeline}>
                    <View style={[
                      styles.timelineDot,
                      durak.type === 'start' ? styles.timelineDotFirst : styles.timelineDotReturn
                    ]} />
                    {hasNext && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.durakContent}>
                    <View style={styles.durakHeader}>
                      <View style={[styles.pointIcon, { backgroundColor: durak.type === 'start' ? Colors.orange : Colors.green }]}>
                        <Text style={styles.pointIconText}>{durak.type === 'start' ? '🏁' : '🏠'}</Text>
                      </View>
                      <View style={styles.durakInfo}>
                        <Text style={[styles.durakIsim, { color: durak.type === 'start' ? Colors.orange : Colors.green }]}>{durak.label}</Text>
                        <Text style={styles.durakAdres}>{durak.type === 'start' ? 'Başlangıç' : 'Bitiş'} Noktası</Text>
                      </View>
                      <View style={styles.durakZaman}>
                        <Text style={styles.durakArr}>{durak.arr}</Text>
                      </View>
                    </View>
                    {hasNext && (() => {
                      const next = duraklar[i + 1];
                      const nextLat = next.isPoint ? next.lat : next.row[1];
                      const nextLng = next.isPoint ? next.lng : next.row[2];
                      const km = haversine(durak.lat, durak.lng, nextLat, nextLng).toFixed(1);
                      return <Text style={styles.araKm}>↓ {km} km</Text>;
                    })()}
                  </View>
                </View>
              );
            }

            const { row, arr, dep } = durak;
            const [, , , adres, isim, , brandCode] = row;

            return (
              <View key={row[0]} style={styles.durak}>
                <View style={styles.timeline}>
                  <View style={styles.timelineDot} />
                  {hasNext && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.durakContent}>
                  <View style={styles.durakHeader}>
                    <BrandIcon brandCode={brandCode} size={24} />
                    <View style={styles.durakInfo}>
                      <Text style={styles.durakIsim} numberOfLines={1}>{isim}</Text>
                      <Text style={styles.durakAdres} numberOfLines={1}>{adres}</Text>
                    </View>
                    <View style={styles.durakRight}>
                      <View style={styles.durakZaman}>
                        <Text style={styles.durakArr}>{arr}</Text>
                        <Text style={styles.durakDep}>çıkış {dep}</Text>
                      </View>
                      {!optimizeEdildi && (
                        <Pressable 
                          style={styles.btnRemove} 
                          {...pressHandlers(() => toggleSecim(row))}
                        >
                          <Text style={styles.btnRemoveText}>✕</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {hasNext && (() => {
                    const next = duraklar[i + 1];
                    const nextLat = next.isPoint ? next.lat : next.row[1];
                    const nextLng = next.isPoint ? next.lng : next.row[2];
                    const km = haversine(row[1], row[2], nextLat, nextLng).toFixed(1);
                    return <Text style={styles.araKm}>↓ {km} km</Text>;
                  })()}
                </View>
              </View>
            );
          })}
        </View>

        {/* Butonlar */}
        <View style={styles.buttons}>
          <Pressable style={styles.btnMaps} {...pressHandlers(haritadaGoster)}>
            <Text style={styles.btnMapsText}>🗺 Haritada Göster</Text>
          </Pressable>
          <View style={styles.btnRow}>
            <Pressable style={styles.btnSecondary} {...pressHandlers(rotayiSifirla)}>
              <Text style={styles.btnSecondaryText}>Rotayı Sıfırla</Text>
            </Pressable>
            <Pressable
              style={[styles.btnSecondary, { borderColor: '#FFAAAA' }]}
              {...pressHandlers(() => Alert.alert(
                'Seçimi Temizle',
                'Tüm seçili mağazalar ve noktalar silinecek.',
                [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Temizle', style: 'destructive', onPress: secimTemizle },
                ]
              ))}
            >
              <Text style={[styles.btnSecondaryText, { color: '#C00' }]}>Seçimi Temizle</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.txt2 },
  emptyHint: { fontSize: 13, color: Colors.txt3 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.bg,
  },
  statKart: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  statLabel: { fontSize: 10, color: Colors.txt3, marginBottom: 3 },
  statVal: { fontSize: 14, fontWeight: '700', color: Colors.txt, textAlign: 'center' },
  statUnit: { fontSize: 10, fontWeight: '400', color: Colors.txt2 },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginBottom: 10,
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
  btnOptimize: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 3,
  },
  btnOptimizeText: { color: 'white', fontSize: 15, fontWeight: '700' },
  btnOptimizeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  optimizeInfo: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  optimizeInfoText: { fontSize: 13, color: '#1A7F4B', fontWeight: '500', textAlign: 'center' },
  durak: { flexDirection: 'row', gap: 10 },
  timeline: { width: 20, alignItems: 'center' },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.orange,
    marginTop: 4,
  },
  timelineDotFirst: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.orange,
    backgroundColor: 'white',
  },
  timelineDotReturn: {
    backgroundColor: Colors.green,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border2,
    marginVertical: 2,
    minHeight: 20,
  },
  durakContent: { flex: 1, paddingBottom: 8 },
  durakHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  durakInfo: { flex: 1 },
  durakRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  durakIsim: { fontSize: 13, fontWeight: '600', color: Colors.txt },
  durakAdres: { fontSize: 11, color: Colors.txt2, marginTop: 1 },
  durakZaman: { alignItems: 'flex-end' },
  durakArr: { fontSize: 13, fontWeight: '700', color: Colors.orange },
  durakDep: { fontSize: 10, color: Colors.txt3 },
  btnRemove: {
    padding: 6,
    backgroundColor: '#FFF1F0',
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FFAAAA',
  },
  btnRemoveText: { color: '#C00', fontSize: 10, fontWeight: '700' },
  araKm: { fontSize: 11, color: Colors.txt3, marginTop: 4, marginLeft: 32 },
  pointIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointIconText: { fontSize: 12 },
  buttons: { padding: 12, gap: 8, marginBottom: 20 },
  btnMaps: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  btnMapsText: { color: 'white', fontSize: 14, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 8 },
  btnSecondary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 13, color: Colors.txt, fontWeight: '500' },
});
