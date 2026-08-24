import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowDown } from '@fortawesome/free-solid-svg-icons';

import {
  getAutoDownloadMedia,
  MEDIA_AUTO_DOWNLOAD_KEY,
  saveMediaPreference,
} from '@/shared/utils/mediaPreferences';

import styles from './GeneralSection.module.css';

function PreferenceSwitch({ checked, description, icon, label, onChange }) {
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
}

function GeneralSection() {
  const [autoDownload, setAutoDownload] = useState(getAutoDownloadMedia);

  const updatePreference = (key, value, setter) => {
    setter(value);
    saveMediaPreference(key, value);
  };

  return (
    <div className={styles.generalContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.eyebrow}>Media preferences</span>
        <h2>General</h2>
        <p>Control how shared photos, videos, audio, and files behave on this device.</p>
      </div>

      <section className={styles.preferenceGroup} aria-labelledby="media-preferences-title">
        <div className={styles.groupHeader}>
          <h3 id="media-preferences-title">Photos and videos</h3>
          <p>These preferences are stored locally in this browser.</p>
        </div>

        <PreferenceSwitch
          icon={faCloudArrowDown}
          label="Automatic media download"
          description="Load media as soon as messages appear. Turn this off to download each item manually."
          checked={autoDownload}
          onChange={(value) => updatePreference(MEDIA_AUTO_DOWNLOAD_KEY, value, setAutoDownload)}
        />

      </section>

      <div className={styles.preferenceNote}>
        <strong>Manual downloads save bandwidth</strong>
        <span>Unopened media stays blurred and is not requested from MinIO until you choose to load it.</span>
      </div>
    </div>
  );
}

export default GeneralSection;
