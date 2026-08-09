import { useEffect, useState } from 'react';

import { wallpapers, WALLPAPER_STORAGE_KEY } from '@/shared/utils/wallpapers';

import styles from './AppearanceSection.module.css';

function AppearanceSection() {
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window === 'undefined') {
      return 'aurora';
    }
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'aurora';
  });

  useEffect(() => {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, selectedId);
  }, [selectedId]);

  return (
    <div className={styles.appearanceContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.eyebrow}>Chat personalization</span>
        <h2>Choose your atmosphere</h2>
        <p>Pick a subtle background designed to keep every message easy to read.</p>
      </div>

      <div className={styles.wallpaperGrid}>
        {wallpapers.map((wallpaper) => {
          const isSelected = wallpaper.id === selectedId;
          return (
            <button
              key={wallpaper.id}
              type="button"
              className={`${styles.wallpaperCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => setSelectedId(wallpaper.id)}
              aria-pressed={isSelected}
            >
              <div
                className={`${styles.wallpaperPreview} ${
                  wallpaper.src ? '' : styles.wallpaperPreviewEmpty
                }`}
                style={wallpaper.src ? { backgroundImage: `url(${wallpaper.src})` } : undefined}
              >
                <div className={`${styles.previewBubble} ${styles.previewBubbleIncoming}`}>Hey, how is it going?</div>
                <div
                  className={`${styles.previewBubble} ${styles.previewBubbleOutgoing}`}
                  style={{ '--wallpaper-accent': wallpaper.accent }}
                >
                  Looking good ✨
                </div>
                {isSelected && <span className={styles.previewCheck}>✓</span>}
              </div>
              <div className={styles.wallpaperLabel}>
                <span className={styles.wallpaperMeta}>
                  <strong>{wallpaper.label}</strong>
                  <small>{wallpaper.description}</small>
                </span>
                <span
                  className={styles.accentDot}
                  style={{ backgroundColor: wallpaper.accent }}
                  aria-hidden="true"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AppearanceSection;
