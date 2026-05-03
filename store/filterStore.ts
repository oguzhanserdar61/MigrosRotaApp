import { create } from 'zustand';
import { BrandColors } from '../constants/theme';

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

const defaultBrands = new Set(Object.keys(BrandColors));

export const useFilterStore = create<FilterStore>((set) => ({
  il: 'İSTANBUL',
  ilce: '',
  search: '',
  activeBrands: defaultBrands,

  ilAyarla: (il) => set({ il, ilce: '', search: '' }),
  ilceAyarla: (ilce) => set({ ilce }),
  searchAyarla: (search) => set({ search }),

  brandToggle: (brand) => set(s => {
    const next = new Set(s.activeBrands);
    if (next.has(brand)) next.delete(brand);
    else next.add(brand);
    return { activeBrands: next };
  }),

  sifirla: () => set({
    il: 'İSTANBUL',
    ilce: '',
    search: '',
    activeBrands: new Set(Object.keys(BrandColors)),
  }),
}));
