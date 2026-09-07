export const WALLPAPER_STORAGE_KEY = 'chat_wallpaper';

const BASE_URL = import.meta.env.BASE_URL || '/';
const withBase = (path) => `${BASE_URL}${path}`;

export const wallpapers = [
  { id: 'none', label: 'Midnight', description: 'Clean and distraction-free', src: null, accent: '#3390ec', accentHover: '#2678c7', bubbleStart: '#3390ec', bubbleEnd: '#2476c5' },
  { id: 'aurora', label: 'Aurora', description: 'Cool northern glow', src: withBase('wallpapers/aurora.svg'), accent: '#35bfa6', accentHover: '#269b89', bubbleStart: '#27aa94', bubbleEnd: '#187c74' },
  { id: 'dusk', label: 'Dusk', description: 'Warm violet evening', src: withBase('wallpapers/dusk.svg'), accent: '#d57699', accentHover: '#b95d83', bubbleStart: '#c7658d', bubbleEnd: '#924c79' },
  { id: 'grid', label: 'Blueprint', description: 'Crisp geometric depth', src: withBase('wallpapers/grid.svg'), accent: '#5399db', accentHover: '#3d7fbd', bubbleStart: '#438fd1', bubbleEnd: '#2d6fa9' },
  { id: 'dunes', label: 'Sandstone', description: 'Soft layered terrain', src: withBase('wallpapers/dunes.svg'), accent: '#d28b62', accentHover: '#b66d49', bubbleStart: '#c97b54', bubbleEnd: '#96503d' },
  { id: 'nebula', label: 'Nebula', description: 'Deep cosmic color', src: withBase('wallpapers/nebula.svg'), accent: '#9278df', accentHover: '#775dc2', bubbleStart: '#876cda', bubbleEnd: '#6048ad' },
  { id: 'ocean', label: 'Tide', description: 'Calm teal current', src: withBase('wallpapers/ocean.svg'), accent: '#36aeb5', accentHover: '#278b93', bubbleStart: '#2ba0a8', bubbleEnd: '#1e747d' },
];
