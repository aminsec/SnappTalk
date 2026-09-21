import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudArrowDown,
  faHardDrive,
  faCircleInfo,
  faSliders,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import {
  getAutoDownloadMedia,
  MEDIA_AUTO_DOWNLOAD_KEY,
  saveMediaPreference,
} from '@/shared/utils/mediaPreferences';
import { wallpapers, WALLPAPER_STORAGE_KEY } from '@/shared/utils/wallpapers';

import styles from './GeneralSection.module.css';

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface PreferenceSwitchProps {
  checked: boolean;
  description: string;
  icon: IconDefinition;
  label: string;
  onChange: (checked: boolean) => void;
}

const PreferenceSwitch: React.FC<PreferenceSwitchProps> = ({
  checked,
  description,
  icon,
  label,
  onChange,
}) => {
  return (
    <div className={styles.preferenceRow}>
      <span className={styles.preferenceIcon} aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className={styles.preferenceCopy}>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={label}
        />
        <span className={styles.switchTrack} aria-hidden="true">
          <span className={styles.switchThumb} />
        </span>
      </label>
    </div>
  );
};

const GeneralSection: React.FC = () => {
  const [autoDownload, setAutoDownload] = useState<boolean>(getAutoDownloadMedia);

  // Dynamic Appearance Theme Sync
  const [wallpaperId, setWallpaperId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'aurora';
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'aurora';
  });

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WALLPAPER_STORAGE_KEY && event.newValue) {
        setWallpaperId(event.newValue);
      }
    };

    const handleCustomChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ wallpaperId: string }>;
      if (customEvent.detail?.wallpaperId) {
        setWallpaperId(customEvent.detail.wallpaperId);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('wallpaper-change', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('wallpaper-change', handleCustomChange);
    };
  }, []);

  const resolvedWallpaper = useMemo(() => {
    return (
      wallpapers.find((w) => w.id === wallpaperId) ||
      wallpapers.find((w) => w.id === 'aurora') ||
      wallpapers[0]
    );
  }, [wallpaperId]);

  const dynamicThemeStyles = useMemo(() => {
    const accent = resolvedWallpaper.accent || '#3390ec';
    const accentHover = resolvedWallpaper.accentHover || '#2678c7';
    return {
      '--theme-accent': accent,
      '--theme-accent-hover': accentHover,
      '--theme-accent-soft': hexToRgba(accent, 0.12),
      '--theme-accent-border': hexToRgba(accent, 0.28),
      '--theme-accent-glow': hexToRgba(accent, 0.25),
      '--btn-color': accent,
      '--btn-hover': accentHover,
    } as React.CSSProperties;
  }, [resolvedWallpaper]);

  const updatePreference = (
    key: string,
    value: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter(value);
    saveMediaPreference(key, value);
  };

  return (
    <div className={styles.generalContainer} style={dynamicThemeStyles}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <span className={styles.eyebrow}>Device & Media Preferences</span>
        <h2>General Settings</h2>
        <p>Control how shared media behaves, manage network consumption, and local device preferences.</p>
      </div>

      {/* 1. Media Downloads Card */}
      <div className={styles.cardSection}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderIconWrapper}>
            <FontAwesomeIcon icon={faCloudArrowDown} />
          </div>
          <div>
            <h4>Photos & Media Downloads</h4>
            <p>Configure how images, audio, and attachments load on this device.</p>
          </div>
        </div>

        <div className={styles.controlsList}>
          <PreferenceSwitch
            icon={faSliders}
            label="Automatic media download"
            description="Load media as soon as messages appear. Turn this off to download each item manually."
            checked={autoDownload}
            onChange={(value) => updatePreference(MEDIA_AUTO_DOWNLOAD_KEY, value, setAutoDownload)}
          />
        </div>

        <div className={styles.infoCallout}>
          <FontAwesomeIcon icon={faCircleInfo} className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Manual downloads save bandwidth</strong>
            <span>
              When auto-download is disabled, media remains blurred and is only fetched when you click to load it.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Device Storage Card */}
      <div className={styles.cardSection}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderIconWrapper}>
            <FontAwesomeIcon icon={faHardDrive} />
          </div>
          <div>
            <h4>Local Device Storage</h4>
            <p>Session data and preferences stored locally in this browser.</p>
          </div>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Storage Scope</span>
            <span className={styles.metaValue}>This Browser Session</span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Bandwidth Saver</span>
            <span className={styles.metaValue}>
              {!autoDownload ? (
                <span className={styles.badgeActive}>
                  <FontAwesomeIcon icon={faCheck} className={styles.checkIcon} /> Enabled
                </span>
              ) : (
                <span className={styles.badgeStandard}>Standard</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSection;
