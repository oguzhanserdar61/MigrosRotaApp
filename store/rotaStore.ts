import { create } from 'zustand';
import { optimizeRoute } from '../utils/tsp';
import { haversine } from '../utils/haversine';
import type { StoreRow } from '../utils/magazaData';

export interface LocationPoint {
  lat: number;
  lng: number;
  label: string;
  il?: string;
  ilce?: string;
}

export interface TurParametreleri {
  baslangicSaati: string;   // "09:00"
  magazaBasiDakika: number; // 30
  hedefMagaza: number;      // 8
  maksSaat: number;         // 8
}

interface RotaStore {
  // Seçim
  secili: StoreRow[];
  odakId: string | null;

  // Noktalar
  startPoint: LocationPoint | null;
  endPoint: LocationPoint | null;

  // Tur parametreleri
  tur: TurParametreleri;

  // Hesaplanan
  optimizeEdildi: boolean;
  toplamKm: number;

  // Actions
  toggleSecim: (row: StoreRow) => void;
  odakAyarla: (id: string | null) => void;
  startPointAyarla: (p: LocationPoint | null) => void;
  endPointAyarla: (p: LocationPoint | null) => void;
  turGuncelle: (p: Partial<TurParametreleri>) => void;
  rotayiOlustur: () => void;
  rotayiSifirla: () => void;
  secimTemizle: () => void;
  filtreTemizle: () => void;
}

export function calcKm(rows: StoreRow[], start?: LocationPoint | null, end?: LocationPoint | null): number {
  let d = 0;
  const points: { lat: number; lng: number }[] = [];
  if (start) points.push(start);
  rows.forEach(r => points.push({ lat: r[1], lng: r[2] }));
  if (end) points.push(end);

  for (let i = 1; i < points.length; i++) {
    d += haversine(points[i-1].lat, points[i-1].lng, points[i].lat, points[i].lng);
  }
  return Math.round(d * 10) / 10;
}

export const useRotaStore = create<RotaStore>((set, get) => ({
  secili: [],
  odakId: null,
  startPoint: null,
  endPoint: null,
  tur: {
    baslangicSaati: '09:00',
    magazaBasiDakika: 30,
    hedefMagaza: 8,
    maksSaat: 8,
  },
  optimizeEdildi: false,
  toplamKm: 0,

  toggleSecim: (row) => set(s => {
    const var_ = s.secili.some(m => m[0] === row[0]);
    const yeni = var_ ? s.secili.filter(m => m[0] !== row[0]) : [...s.secili, row];
    return { secili: yeni, optimizeEdildi: false, toplamKm: calcKm(yeni, s.startPoint, s.endPoint) };
  }),

  odakAyarla: (id) => set({ odakId: id }),

  startPointAyarla: (p) => set(s => ({
    startPoint: p,
    optimizeEdildi: false,
    toplamKm: calcKm(s.secili, p, s.endPoint),
  })),

  endPointAyarla: (p) => set(s => ({
    endPoint: p,
    optimizeEdildi: false,
    toplamKm: calcKm(s.secili, s.startPoint, p),
  })),

  turGuncelle: (p) => set(s => ({ tur: { ...s.tur, ...p } })),

  rotayiOlustur: () => {
    const { secili, startPoint, endPoint } = get();
    if (secili.length < 1 && (!startPoint || !endPoint)) return;

    const noktalar = secili.map(m => ({ id: m[0], lat: m[1], lng: m[2] }));
    const optimized = optimizeRoute(noktalar, startPoint, endPoint);
    const optimizedRows = optimized.map(n => secili.find(m => m[0] === n.id)!);

    set({
      secili: optimizedRows,
      optimizeEdildi: true,
      toplamKm: calcKm(optimizedRows, startPoint, endPoint),
    });
  },

  rotayiSifirla: () => set({ optimizeEdildi: false }),

  secimTemizle: () => set({ secili: [], odakId: null, optimizeEdildi: false, toplamKm: 0, startPoint: null, endPoint: null }),

  filtreTemizle: () => set({ secili: [], odakId: null, optimizeEdildi: false, toplamKm: 0 }),
}));

