export const Colors = {
  orange: '#FF6600',
  orangeDark: '#E65C00',
  orangeLight: '#FFF5E6',
  green: '#1A7F4B',
  bg: '#F7F5F2',
  card: '#FFFFFF',
  border: '#E5E2DC',
  border2: '#D0CCC4',
  txt: '#1A1A1A',
  txt2: '#666666',
  txt3: '#999999',
};

export const BrandColors: Record<string, { color: string; bg: string; tc: string; short: string; label: string }> = {
  migros:     { color: '#FF6600', bg: '#FFF5E6', tc: '#B34700', short: 'M',  label: 'Migros'      },
  mjet:       { color: '#C0000A', bg: '#FFE8E8', tc: '#7A0000', short: 'MJ', label: 'Migros Jet'  },
  macro:      { color: '#6B2FA0', bg: '#F0EEF9', tc: '#4A1F70', short: 'MC', label: 'Macrocenter' },
  macrokiosk: { color: '#8B50C0', bg: '#F5F0FF', tc: '#5A3080', short: 'K',  label: 'Macrokiosk'  },
  '5m':       { color: '#1557A0', bg: '#E3F2FD', tc: '#0C447C', short: '5M', label: '5M'          },
  toptan:     { color: '#0D4A8A', bg: '#E8F0FB', tc: '#0D3B6E', short: 'T',  label: 'Toptan Satış' },
  petimo:     { color: '#E91E63', bg: '#FCE4EC', tc: '#880E4F', short: 'P',  label: 'Petimo'      },
  mion:       { color: '#9C27B0', bg: '#F3E5F5', tc: '#4A148C', short: 'Mi', label: 'Mion'        },
};

export function getBrand(code: string) {
  if (!code) return BrandColors.migros;
  const c = code.toLowerCase();
  return BrandColors[c] ?? BrandColors.migros;
}
