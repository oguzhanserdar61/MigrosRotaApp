import { create } from 'zustand';
import { BrandColors } from '../constants/theme';
import { getAvailableBrands } from '../utils/magazaData';

interface FilterStore {
  il: string;
  ilce: string;
  search: string;
  activeBrands: Set<string>;

  ilAyarla: (il: string) => void;
  ilceAyarla: (ilce: string) => void;
  searchAyarla: (s: string) => void;
  brandToggle: (brand: string) => void;
  sifirla: () => void;
}

const defaultIl = 'İSTANBUL';
const defaultAvailable = new Set(getAvailableBrands(defaultIl));

export const useFilterStore = create<FilterStore>((set, get) => ({
  il: defaultIl,
  ilce: '',
  search: '',
  activeBrands: defaultAvailable,

  ilAyarla: (il) => {
    const available = getAvailableBrands(il, '');
    set({ il, ilce: '', search: '', activeBrands: new Set(available) });
  },
  ilceAyarla: (ilce) => {
    const { il } = get();
    const available = getAvailableBrands(il, ilce);
    set({ ilce, activeBrands: new Set(available) });
  },
  searchAyarla: (search) => set({ search }),

  brandToggle: (brand) => set(s => {
    const next = new Set(s.activeBrands);
    if (next.has(brand)) next.delete(brand);
    else next.add(brand);
    return { activeBrands: next };
  }),

  sifirla: () => {
    const available = getAvailableBrands(defaultIl, '');
    set({
      il: defaultIl,
      ilce: '',
      search: '',
      activeBrands: new Set(available),
    });
  },
}));
