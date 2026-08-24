import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTextHeight } from '@fortawesome/free-solid-svg-icons';

import { wallpapers, WALLPAPER_STORAGE_KEY } from '@/shared/utils/wallpapers';
import {
  getMessageSize,
  getMessageSizeOption,
  MESSAGE_SIZE_OPTIONS,
  saveMessageSize,
} from '@/shared/utils/messagePreferences';

import styles from './AppearanceSection.module.css';

function AppearanceSection() {
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window === 'undefined') {
      return 'aurora';
    }
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'aurora';
  });
  const [messageSize, setMessageSize] = useState(getMessageSize);
  const selectedMessageSize = getMessageSizeOption(messageSize);

  useEffect(() => {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, selectedId);
  }, [selectedId]);

  const handleMessageSizeChange = (value) => {
    setMessageSize(value);
    saveMessageSize(value);
  };

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
            <span className={styles.messageSizeMarkerSmall} aria-hidden="true">A</span>
            <input
              type="range"
              className={styles.messageSizeRange}
              min="0"
              max={MESSAGE_SIZE_OPTIONS.length - 1}
              step="1"
              value={messageSize}
              onChange={(event) => handleMessageSizeChange(Number(event.target.value))}
              aria-label="Message size"
              style={{ '--message-size-progress': `${(messageSize / (MESSAGE_SIZE_OPTIONS.length - 1)) * 100}%` }}
            />
            <span className={styles.messageSizeMarkerLarge} aria-hidden="true">A</span>
          </div>
          <div className={styles.messageSizeScale} aria-hidden="true">
            <span>Tiny</span>
            <span>Default</span>
            <span>Huge</span>
          </div>
        </div>
        <div
          className={styles.messageSizePreviewStage}
          style={{
            '--preview-font-size': selectedMessageSize.fontSize,
            '--preview-line-height': selectedMessageSize.lineHeight,
            '--preview-padding-y': selectedMessageSize.bubblePaddingY,
            '--preview-padding-x': selectedMessageSize.bubblePaddingX,
            '--preview-radius': selectedMessageSize.bubbleRadius,
          }}
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
}

export default AppearanceSection;
