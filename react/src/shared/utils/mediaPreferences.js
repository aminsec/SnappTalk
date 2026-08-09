export const MEDIA_AUTO_DOWNLOAD_KEY = 'media_auto_download';
export const MEDIA_FULLSCREEN_KEY = 'media_fullscreen_viewer';

const readBooleanPreference = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const storedValue = localStorage.getItem(key);
  if (storedValue === null) return fallback;
  return storedValue === 'true';
};

export const getAutoDownloadMedia = () => readBooleanPreference(MEDIA_AUTO_DOWNLOAD_KEY, true);
export const getFullscreenMedia = () => readBooleanPreference(MEDIA_FULLSCREEN_KEY, true);

export const saveMediaPreference = (key, value) => {
  localStorage.setItem(key, String(Boolean(value)));
  window.dispatchEvent(new CustomEvent('media-preferences-change', {
    detail: { key, value: Boolean(value) },
  }));
};
