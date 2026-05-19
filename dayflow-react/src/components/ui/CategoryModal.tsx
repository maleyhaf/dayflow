import React, { useState, useRef, useEffect } from 'react';
import { Category } from '../../types';
import styles from './CategoryModal.module.css';

const COLORS = [
  '#2D5BE3', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
  '#F43F5E', '#E85D75', '#F4A261', '#F59E0B', '#E9C46A',
  '#10B981', '#52B788', '#06B6D4', '#14B8A6', '#34A853',
];

const ICONS = [
  '📚', '💪', '💼', '✨', '🏃', '🎵', '🍎', '💊',
  '✈️', '🏠', '💰', '🎮', '📝', '🔬', '🎨', '🏋️',
  '🧘', '🛒', '🐾', '⚽', '🎯', '📅', '🔥', '💡',
];

interface Props {
  onClose: () => void;
  onSave: (cat: Category) => void;
}

export default function CategoryModal({ onClose, onSave }: Props) {
  const [name, setName]     = useState('');
  const [color, setColor]   = useState(COLORS[0]);
  const [icon, setIcon]     = useState(ICONS[0]);
  const [nameError, setNameError] = useState(false);

  const nameRef    = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 60);
  }, []);

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

  const handleSave = () => {
    if (!name.trim()) {
      setNameError(true);
      nameRef.current?.focus();
      return;
    }
    onSave({
      id:    'cat_' + Date.now(),
      name:  name.trim(),
      color,
      icon,
    });
  };

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.preview} style={{ background: color }}>
            {icon}
          </span>
          <h2 className={styles.title}>New category</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>

          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              ref={nameRef}
              className={`${styles.input} ${nameError ? styles.inputError : ''}`}
              value={name}
              onChange={e => { setName(e.target.value); setNameError(false); }}
              placeholder="Category name..."
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Color */}
          <div className={styles.field}>
            <label className={styles.label}>Color</label>
            <div className={styles.colorGrid}>
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`${styles.colorDot} ${c === color ? styles.colorDotSelected : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  type="button"
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className={styles.field}>
            <label className={styles.label}>Icon</label>
            <div className={styles.iconGrid}>
              {ICONS.map(ic => (
                <button
                  key={ic}
                  className={`${styles.iconBtn} ${ic === icon ? styles.iconBtnSelected : ''}`}
                  style={ic === icon ? { background: color + '22', borderColor: color } : {}}
                  onClick={() => setIcon(ic)}
                  type="button"
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            style={{ background: color }}
            onClick={handleSave}
          >
            Create category
          </button>
        </div>

      </div>
    </div>
  );
}
