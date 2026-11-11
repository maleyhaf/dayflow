import React from 'react';
import styles from './Logo.module.css';

interface Props {
  size?: number; // height of the icon tile in px; the wordmark scales with it
}

// Icon tile + live "DayFlow" wordmark (text uses theme colours, so it works in dark mode)
export default function Logo({ size = 28 }: Props) {
  return (
    <span className={styles.logo} style={{ fontSize: size * 0.82, gap: size * 0.3 }}>
      <img
        src={`${process.env.PUBLIC_URL}/logo-mark.svg`}
        alt=""
        width={size}
        height={size}
        className={styles.mark}
      />
      <span className={styles.word}>
        Day<span className={styles.accent}>Flow</span>
      </span>
    </span>
  );
}
