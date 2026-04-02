// components/Notification.jsx
import React from 'react';
import styles from './Notification.module.css';

export default function Notification({ notification }) {
  if (!notification) return null;
  return (
    <div className={`${styles.toast} ${styles[notification.type] || ''}`}>
      {notification.msg}
    </div>
  );
}
