export const WALLPAPER_STORAGE_KEY = 'chat_wallpaper';

const BASE_URL = import.meta.env.BASE_URL || '/';
const withBase = (path) => `${BASE_URL}${path}`;

export const wallpapers = [
  { id: 'none', label: 'None', src: null },
  { id: 'aurora', label: 'Aurora', src: withBase('wallpapers/aurora.svg') },
  { id: 'dusk', label: 'Dusk', src: withBase('wallpapers/dusk.svg') },
  { id: 'grid', label: 'Grid', src: withBase('wallpapers/grid.svg') },
  { id: 'dunes', label: 'Dunes', src: withBase('wallpapers/dunes.svg') },
];
