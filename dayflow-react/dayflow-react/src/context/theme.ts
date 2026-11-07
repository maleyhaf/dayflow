import { ColorTheme, ThemePreset } from '../types';

export const PRESETS: Record<ColorTheme, ThemePreset> = {
  default: {
    label: 'Default',
    accent: '#2D5BE3',
    bg: '#F7F4EE',
    surface: '#FFFFFF',
    surface2: '#F0EDE6',
    dots: ['#2D5BE3', '#6366F1', '#A5B4FC'],
  },
  warm: {
    label: 'Warm sunset',
    accent: '#E85D75',
    bg: '#FFF8F5',
    surface: '#FFFFFF',
    surface2: '#FFF0EB',
    dots: ['#E85D75', '#F4A261', '#E9C46A'],
  },
  ocean: {
    label: 'Ocean breeze',
    accent: '#1A6DB5',
    bg: '#F0F7FF',
    surface: '#FFFFFF',
    surface2: '#E8F4FF',
    dots: ['#1A6DB5', '#00B4D8', '#90E0EF'],
  },
  forest: {
    label: 'Forest calm',
    accent: '#2D6A4F',
    bg: '#F2FAF5',
    surface: '#FFFFFF',
    surface2: '#E8F7EE',
    dots: ['#2D6A4F', '#52B788', '#D8F3DC'],
  },
  mono: {
    label: 'Monochrome',
    accent: '#2D2D2D',
    bg: '#F5F5F5',
    surface: '#FFFFFF',
    surface2: '#EBEBEB',
    dots: ['#2D2D2D', '#6B6B6B', '#C2C2C2'],
  },
};

export function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`;
}

export function applyPreset(preset: ThemePreset, isDark: boolean) {
  const root = document.documentElement;
  root.style.setProperty('--accent', preset.accent);
  root.style.setProperty('--accent-light', `rgba(${hexToRgb(preset.accent)},0.11)`);
  if (isDark) {
    root.style.removeProperty('--bg');
    root.style.removeProperty('--surface');
    root.style.removeProperty('--surface2');
  } else {
    root.style.setProperty('--bg', preset.bg);
    root.style.setProperty('--surface', preset.surface);
    root.style.setProperty('--surface2', preset.surface2);
  }
}

// Blends a hex color toward white by `amount` (0 = white, 1 = full hex color)
function mixWithWhite(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c * amount + 255 * (1 - amount));
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export function applyAccentHex(hex: string, isDark: boolean) {
  const root = document.documentElement;
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--accent-light', `rgba(${hexToRgb(hex)},0.11)`);

  if (isDark) {
    root.style.removeProperty('--bg');
    root.style.removeProperty('--surface');
    root.style.removeProperty('--surface2');
  } else {
    // Mirrors the preset pattern: surface stays white, bg/surface2 are
    // light accent tints (surface2 slightly stronger than bg)
    root.style.setProperty('--bg', mixWithWhite(hex, 0.05));
    root.style.setProperty('--surface', '#FFFFFF');
    root.style.setProperty('--surface2', mixWithWhite(hex, 0.11));
  }
}

// Accept either a preset key (ColorTheme) or a raw hex string (e.g. "#2D5BE3")
export function applyThemeValue(value: string, isDark: boolean) {
  if (!value) return;
  if (value.startsWith('#')) {
    applyAccentHex(value, isDark);
    return;
  }
  if ((PRESETS as any)[value]) {
    applyPreset((PRESETS as any)[value], isDark);
  }
}
