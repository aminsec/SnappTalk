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
        <h2>Appearance</h2>
        <p>Choose a wallpaper for your chat background.</p>
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
                {!wallpaper.src && <span>None</span>}
              </div>
              <div className={styles.wallpaperLabel}>
                <span>{wallpaper.label}</span>
                {isSelected && <span className={styles.selectedBadge}>Selected</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AppearanceSection;
