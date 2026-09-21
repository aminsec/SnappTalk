export interface MessageSizeOption {
  value: number;
  label: string;
  description: string;
  fontSize: string;
  lineHeight: string;
  bubblePaddingY: string;
  bubblePaddingX: string;
  bubbleGap: string;
  bubbleRadius: string;
  captionFontSize: string;
}

export interface Wallpaper {
  id: string;
  label: string;
  description: string;
  src: string | null;
  accent: string;
  accentHover: string;
  bubbleStart: string;
  bubbleEnd: string;
}

