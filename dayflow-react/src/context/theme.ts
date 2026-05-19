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

export function applyAccentHex(hex: string, isDark: boolean) {
  const root = document.documentElement;
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--accent-light', `rgba(${hexToRgb(hex)},0.11)`);
  // For a raw accent hex we don't change surface colors — leave preset surfaces untouched
  if (isDark) {
    root.style.removeProperty('--bg');
    root.style.removeProperty('--surface');
    root.style.removeProperty('--surface2');
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
