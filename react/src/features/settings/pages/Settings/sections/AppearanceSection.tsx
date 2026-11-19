import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTextHeight, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

import { wallpapers, WALLPAPER_STORAGE_KEY } from '@/shared/utils/wallpapers';
import {
  getMessageSize,
  getMessageSizeOption,
  MESSAGE_SIZE_OPTIONS,
  saveMessageSize,
} from '@/shared/utils/messagePreferences';

import styles from './AppearanceSection.module.css';

export const THEME_STORAGE_KEY = 'app_theme';

const AppearanceSection: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'aurora';
    }
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'aurora';
  });
  const [messageSize, setMessageSize] = useState<number>(getMessageSize);
  const selectedMessageSize = getMessageSizeOption(messageSize);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'light' ? '#FFFFFF' : '#161B1C');
    }
    window.dispatchEvent(
      new CustomEvent('theme-change', { detail: { theme: newTheme } })
    );
  };

  useEffect(() => {
    const handleThemeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'dark' | 'light' }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      }
    };
    window.addEventListener('theme-change', handleThemeEvent);
    return () => window.removeEventListener('theme-change', handleThemeEvent);
  }, []);

  useEffect(() => {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, selectedId);
    window.dispatchEvent(
      new CustomEvent('wallpaper-change', { detail: { wallpaperId: selectedId } })
    );
  }, [selectedId]);

  const handleMessageSizeChange = (value: number) => {
    setMessageSize(value);
    saveMessageSize(value);
  };

  return (
    <div className={styles.appearanceContainer}>
      {/* Theme Mode Selector */}
      <section className={styles.themeSection} aria-labelledby="theme-selection-title">
        <div className={styles.sectionHeader}>
          <h2 id="theme-selection-title">Theme</h2>
        </div>
        <div className={styles.themeGrid}>
          <button
            type="button"
            className={`${styles.themeCard} ${theme === 'dark' ? styles.themeCardActive : ''}`}
            onClick={() => handleThemeChange('dark')}
            aria-pressed={theme === 'dark'}
          >
            <div className={`${styles.themePreview} ${styles.themePreviewDark}`}>
              <div className={styles.themePreviewHeader}>
                <span className={styles.themePreviewDot} />
                <span className={styles.themePreviewBar} />
              </div>
              <div className={styles.themePreviewContent}>
                <div className={`${styles.themeBubble} ${styles.themeBubbleReceivedDark}`}>
                  Dark mode
                </div>
                <div className={`${styles.themeBubble} ${styles.themeBubbleSent}`}>
                  Easy on the eyes ✨
                </div>
              </div>
              {theme === 'dark' && <span className={styles.themeCheck}>✓</span>}
            </div>
            <div className={styles.themeCardMeta}>
              <div className={styles.themeIconWrapper}>
                <FontAwesomeIcon icon={faMoon} />
              </div>
              <div className={styles.themeInfo}>
                <strong>Dark Theme</strong>
                <small>Deep charcoal tones</small>
              </div>
            </div>
          </button>

          <button
            type="button"
            className={`${styles.themeCard} ${theme === 'light' ? styles.themeCardActive : ''}`}
            onClick={() => handleThemeChange('light')}
            aria-pressed={theme === 'light'}
          >
            <div className={`${styles.themePreview} ${styles.themePreviewLight}`}>
              <div className={styles.themePreviewHeader}>
                <span className={styles.themePreviewDot} />
                <span className={styles.themePreviewBar} />
              </div>
              <div className={styles.themePreviewContent}>
                <div className={`${styles.themeBubble} ${styles.themeBubbleReceivedLight}`}>
                  White / Light
                </div>
                <div className={`${styles.themeBubble} ${styles.themeBubbleSent}`}>
                  Crisp & bright ☀️
                </div>
              </div>
              {theme === 'light' && <span className={styles.themeCheck}>✓</span>}
            </div>
            <div className={styles.themeCardMeta}>
              <div className={styles.themeIconWrapper}>
                <FontAwesomeIcon icon={faSun} />
              </div>
              <div className={styles.themeInfo}>
                <strong>White Theme</strong>
                <small>Clean, bright & crisp</small>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Atmosphere / Wallpaper */}
      <section className={styles.wallpaperSection}>
        <div className={styles.sectionHeader}>
          <h2>Choose your atmosphere</h2>
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
                  <div className={`${styles.previewBubble} ${styles.previewBubbleIncoming}`}>
                    Hey, how is it going?
                  </div>
                  <div
                    className={`${styles.previewBubble} ${styles.previewBubbleOutgoing}`}
                    style={{ '--wallpaper-accent': wallpaper.accent } as React.CSSProperties}
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
      </section>

      {/* Message Size */}
      <section className={styles.messageSizeSection} aria-labelledby="message-size-title">
        <div className={styles.messageSizeHeader}>
          <span className={styles.messageSizeIcon} aria-hidden="true">
            <FontAwesomeIcon icon={faTextHeight} />
          </span>
          <div>
            <h3 id="message-size-title">Message size</h3>
            <p>Adjust the text and bubble spacing together.</p>
          </div>
        </div>
        <div className={styles.messageSizeControl}>
          <div className={styles.messageSizeValue}>
            <strong>{selectedMessageSize.label}</strong>
            <span>{selectedMessageSize.description}</span>
          </div>
          <div className={styles.messageSizeSliderRow}>
            <span className={styles.messageSizeMarkerSmall} aria-hidden="true">
              A
            </span>
            <input
              type="range"
              className={styles.messageSizeRange}
              min="0"
              max={MESSAGE_SIZE_OPTIONS.length - 1}
              step="1"
              value={messageSize}
              onChange={(event) => handleMessageSizeChange(Number(event.target.value))}
              aria-label="Message size"
              style={
                {
                  '--message-size-progress': `${
                    (messageSize / (MESSAGE_SIZE_OPTIONS.length - 1)) * 100
                  }%`,
                } as React.CSSProperties
              }
            />
            <span className={styles.messageSizeMarkerLarge} aria-hidden="true">
              A
            </span>
          </div>
          <div className={styles.messageSizeScale} aria-hidden="true">
            <span>Tiny</span>
            <span>Default</span>
            <span>Huge</span>
          </div>
        </div>
        <div
          className={styles.messageSizePreviewStage}
          style={
            {
              '--preview-font-size': selectedMessageSize.fontSize,
              '--preview-line-height': selectedMessageSize.lineHeight,
              '--preview-padding-y': selectedMessageSize.bubblePaddingY,
              '--preview-padding-x': selectedMessageSize.bubblePaddingX,
              '--preview-radius': selectedMessageSize.bubbleRadius,
            } as React.CSSProperties
          }
        >
          <span className={styles.messageSizePreviewLabel}>Preview</span>
          <div className={`${styles.messagePreviewBubble} ${styles.messagePreviewIncoming}`}>
            Can you send me the details?
          </div>
          <div className={`${styles.messagePreviewBubble} ${styles.messagePreviewOutgoing}`}>
            Sure, I’ll send them now ✨
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppearanceSection;
