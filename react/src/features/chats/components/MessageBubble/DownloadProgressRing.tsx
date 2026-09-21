import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faXmark } from '@fortawesome/free-solid-svg-icons';
import { DownloadProgressRingProps } from '../../types/chatPage.types';
import styles from '../../pages/Chats/Chat.module.css';

export const DownloadProgressRing: React.FC<DownloadProgressRingProps> = ({
  progress = 0,
  active = false,
  compact = false,
}) => {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  return (
    <span
      className={`${styles.downloadProgressRing} ${compact ? styles.downloadProgressRingCompact : ''}`}
      style={{ '--download-progress': `${safeProgress * 3.6}deg` } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.downloadProgressRingInner}>
        <FontAwesomeIcon icon={active ? faXmark : faDownload} className={styles.downloadProgressCancel} />
        <span className={styles.downloadProgressPercent}>{Math.round(safeProgress)}%</span>
      </span>
    </span>
  );
};

export default DownloadProgressRing;

