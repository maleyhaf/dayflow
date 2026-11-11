import React from 'react';
import Logo from '../ui/Logo';
import styles from './LoginPage.module.css';

interface Props {
  message: string;
  actions?: { label: string; onClick: () => void }[];
}

// Simple full-screen state used while checking the session / loading data
export default function StatusScreen({ message, actions }: Props) {
  return (
    <div className={styles.status}>
      <div className={styles.statusLogo}>
        <Logo size={40} />
      </div>
      <div>{message}</div>
      {actions && (
        <div className={styles.statusBtns}>
          {actions.map(a => (
            <button key={a.label} className={styles.statusBtn} onClick={a.onClick}>{a.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
