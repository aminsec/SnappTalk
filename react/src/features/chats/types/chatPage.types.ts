import { Message, Conversation, ReplyPreview } from '@/shared/types/chat.types';

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface LockedMediaBox {
  width: number;
  height: number;
  aspectRatio: string;
}

export interface MediaCacheEntry {
  url: string;
  expiresAt: number;
}

export interface GiphyImage {
  url: string;
  width: string;
  height: string;
}

export interface GiphyItem {
  id: string;
  title: string;
  images: {
    original: GiphyImage;
    fixed_width: GiphyImage;
    fixed_height?: GiphyImage;
    downsized_medium?: GiphyImage;
  };
}

export interface PendingEditState {
  messageId: string;
  text: string;
}

export interface ViewerMedia {
  url: string;
  type: string;
  fileName?: string;
  caption?: string;
}

export interface DownloadProgressRingProps {
  progress?: number;
  active?: boolean;
  compact?: boolean;
}

export type { Message, Conversation, ReplyPreview };

