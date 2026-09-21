export const MEDIA_AUTO_DOWNLOAD_KEY = 'media_auto_download';

const readBooleanPreference = (key: string, fallback: boolean): boolean => {
  if (typeof window === 'undefined') return fallback;
  const storedValue = localStorage.getItem(key);
  if (storedValue === null) return fallback;
  return storedValue === 'true';
};

export const getAutoDownloadMedia = (): boolean =>
  readBooleanPreference(MEDIA_AUTO_DOWNLOAD_KEY, true);

export const saveMediaPreference = (key: string, value: boolean): void => {
  localStorage.setItem(key, String(Boolean(value)));
  window.dispatchEvent(
    new CustomEvent('media-preferences-change', {
      detail: { key, value: Boolean(value) },
    })
  );
};

