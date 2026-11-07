import React, { useRef, useEffect, useState } from 'react';
import styles from './SettingsModal.module.css';
// importing the theme of the app
import { ThemePreset, ColorTheme } from '../../types';
import { PRESETS, applyThemeValue } from '../../context/theme';
import { useApp } from '../../context/AppContext';

// settings modal 
// lets user change the theme , account preferences etc
// theme working for now

// color palette for the theme selection
function PalettePanel() {
    const { state, dispatch } = useApp();
    const [hexValue, setHexValue] = useState('');
    const [hexError, setHexError] = useState(false);

    const handlePreset = (key: ColorTheme) => {
        dispatch({ type: 'SET_THEME', payload: key });
        // apply immediately for snappy feedback; AppContext will also apply and persist
        applyThemeValue(key, state.isDark);
    };

    const handleApplyHex = () => {
        const val = hexValue.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            setHexError(false);
            dispatch({ type: 'SET_THEME', payload: val });
            applyThemeValue(val, state.isDark);
        } else {
            setHexError(true);
            setTimeout(() => setHexError(false), 1200);
        }
    };

    return (
        <div className={styles.section}>
            {(Object.entries(PRESETS) as [ColorTheme, ThemePreset][]).map(([key, preset]) => (
                <button
                    key={key}
                    className={`${styles.presetBtn} ${state.theme === key ? styles.presetBtnActive : ''}`}
                    onClick={() => handlePreset(key)}
                >
                    <div className={styles.presetDots}>
                        {preset.dots.map((c, i) => (
                            <span key={i} className={styles.presetDot} style={{ background: c }} />
                        ))}
                    </div>
                    {preset.label}
                </button>
            ))}

            <div className={styles.label} style={{ marginTop: 12 }}>Custom accent</div>
            <div className={styles.hexRow}>
                <input
                    className={`${styles.hexInput} ${hexError ? styles.hexInputError : ''}`}
                    placeholder="#2D5BE3"
                    maxLength={7}
                    value={hexValue}
                    onChange={e => setHexValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleApplyHex()}
                />
                <button className={styles.hexApply} onClick={handleApplyHex}>
                    Apply
                </button>
            </div>
        </div>
    );
}

interface Props {
    onClose: () => void;
    onSave: (theme: string) => void;
}

export default function SettingsModal({ onClose, onSave }: Props) {
    const overlayRef = useRef<HTMLDivElement>(null);

    const icon = '⚙️';

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };


    return (
        <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
            <div className={styles.modal} role="dialog" aria-modal="true">

                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.preview} >
                        {icon}
                    </span>

                    <span className={styles.title}>Settings</span>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings modal">
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.field}>
                        <label className={styles.label}>Theme</label>
                        <PalettePanel />
                    </div>
                </div>

            </div>

        </div>
    );
}



