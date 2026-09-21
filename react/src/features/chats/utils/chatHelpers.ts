import bitcoinIcon from '@/shared/assets/images/mono/acn.svg';
import coconutCocktailIcon from '@/shared/assets/images/mono/bank.svg';
import colosseumIcon from '@/shared/assets/images/mono/bookshelf.svg';
import communicationIcon from '@/shared/assets/images/mono/cactus.svg';
import gasIcon from '@/shared/assets/images/mono/chess.svg';
import heartIcon from '@/shared/assets/images/mono/coffee1.svg';
import libraryIcon from '@/shared/assets/images/mono/colosseum.svg';
import lighthouseIcon from '@/shared/assets/images/mono/lamp.svg';
import motorbikeHelmetIcon from '@/shared/assets/images/mono/pie-chart.svg';
import newsIcon from '@/shared/assets/images/mono/planet.svg';
import origamiIcon from '@/shared/assets/images/mono/plant.svg';
import planetIcon from '@/shared/assets/images/mono/strategy.svg';

import {
  MediaDimensions,
  LockedMediaBox,
  MediaCacheEntry,
  ReplyPreview,
} from '../types/chatPage.types';
import { Message, Conversation, MessageType } from '@/shared/types/chat.types';

// Constants
export const monoIcons = [
  bitcoinIcon,
  coconutCocktailIcon,
  colosseumIcon,
  communicationIcon,
  gasIcon,
  heartIcon,
  libraryIcon,
  lighthouseIcon,
  motorbikeHelmetIcon,
  newsIcon,
  origamiIcon,
  planetIcon,
];

export const GIPHY_API_KEY = '4vT03C5NJwyvvo3NF8iWEXBN1Y6FwV3G';
export const GIPHY_LIMIT = 18;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_MEDIA_BATCH = 10;
export const MESSAGES_LIMIT = 10; // Max number of messages per request
export const MAX_MESSAGE_LENGTH = 255;

export const createOptimisticId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `optimistic-${crypto.randomUUID()}`;
  }
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// Helper functions
export const convertISOtoLocal = (isoDate?: string | Date | null): string => {
  try {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const truncateMessage = (text: string, maxLength = 25): string => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = seconds.toString().padStart(2, '0');
  return `${minutes}:${paddedSeconds}`;
};

export const getMessagePreviewText = (message: any): string => {
  if (!message) return '';
  const content = (message.content || message.text || '').trim();
  if (content) return content;
  switch (message.type) {
    case 'image':
      return 'Photo 📷';
    case 'video':
      return 'Video 🎥';
    case 'gif':
      return 'GIF 🐾';
    case 'sticker':
      return 'Sticker ';
    case 'voice':
      return 'Voice 🎙️';
    case 'audio':
      return getMessageFileName(message) || 'Audio 🎵';
    case 'file':
    case 'document':
      return getMessageFileName(message) || 'Attachment 📎';
    default:
      return '';
  }
};

export const isEmojiOnlyMessage = (text?: string): boolean => {
  const normalized = text?.trim();
  if (!normalized) return false;
  return /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+$/u.test(normalized);
};

export const getConversationId = (conversation: any): string =>
  conversation?._id ||
  conversation?.id ||
  conversation?.conversation_id ||
  conversation?.conversationId ||
  '';

export const getMessageId = (message: any): string =>
  (message?._id || message?.id || '').toString();

export const getMediaStateKey = (message: any): string =>
  (message?.attachment_key || getMessageId(message))?.toString() || '';

export const getReplyMessageId = (reply: any): string | null => {
  if (!reply) return null;
  if (typeof reply !== 'object') return String(reply);
  return (
    reply.messageId ||
    reply.message_id ||
    getMessageId(reply) ||
    reply.replied_to ||
    null
  );
};

export const getMessageMediaUrl = (message: any): string =>
  message?.file_url ||
  message?.media_url ||
  message?.url ||
  message?.fileUrl ||
  message?.mediaUrl ||
  message?.preview_url ||
  message?.local_preview ||
  '';

export const getMessageDownloadUrl = (message: any): string =>
  message?.file_url ||
  message?.media_url ||
  message?.url ||
  message?.fileUrl ||
  message?.mediaUrl ||
  message?.download_url ||
  message?.downloadUrl ||
  '';

export const getSenderId = (message: any): string => {
  const s =
    message?.sender_id ||
    message?.sender?._id ||
    message?.sender ||
    message?.user_id ||
    message?.from_user_id;
  return s ? s.toString() : '';
};

export const getSeenByMap = (message: any): Record<string, any> | null => {
  const seenBy = message?.seen_by || message?.seenBy;
  if (!seenBy || typeof seenBy !== 'object') return null;
  return seenBy;
};

export const hasSeenByOtherUser = (seenBy: Record<string, any> | null, currentUserId?: string): boolean =>
  Object.keys(seenBy || {}).some(
    (key) => key && key !== currentUserId && key !== 'sender'
  );

export const resolveMessageSeen = (message: any, chat: any, currentUserId?: string): boolean => {
  if (typeof message?.seen === 'boolean') return message.seen;
  const seenBy = getSeenByMap(message);
  if (!seenBy || !currentUserId) return false;

  const senderId = getSenderId(message);
  const isMine = senderId && senderId === currentUserId;

  if (chat?.type === 'pv') {
    if (isMine) {
      const contactId = (chat?.contact_info?._id || chat?.contact_info?.id)?.toString();
      if (contactId && Object.prototype.hasOwnProperty.call(seenBy, contactId)) {
        return true;
      }
      return hasSeenByOtherUser(seenBy, currentUserId);
    }
    return Boolean(seenBy[currentUserId]);
  }

  if (isMine) {
    return hasSeenByOtherUser(seenBy, currentUserId);
  }
  return Boolean(seenBy[currentUserId]);
};

export const normalizeMessage = (message: any, chat: any, currentUserId?: string): any => {
  const existingReply =
    message?.reply_to || message?.replyTo || message?.reply_to_message;
  const repliedTo = message?.replied_to;
  const replyPreview = buildReplyPreview(existingReply || repliedTo);

  return {
    ...message,
    reply_to: replyPreview || message?.reply_to,
    seen: resolveMessageSeen(message, chat, currentUserId),
  };
};

export interface UploadMediaOptions {
  onProgress?: (percent: number) => void;
  onRequest?: (req: XMLHttpRequest) => void;
}

export const uploadMediaFile = (
  file: File,
  { onProgress, onRequest }: UploadMediaOptions = {}
): Promise<string> =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/v1/user/media/upload');
    request.withCredentials = true;

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    });

    request.addEventListener('load', () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error('Unable to upload media right now.'));
        return;
      }

      try {
        const data = JSON.parse(request.responseText || '{}');
        resolve(data?.fileKey || data?.file_key || data?.data?.fileKey || '');
      } catch {
        reject(new Error('Upload returned an invalid response.'));
      }
    });

    request.addEventListener('error', () => {
      reject(new Error('Unable to upload media right now.'));
    });

    request.addEventListener('abort', () => {
      const error = new Error('Upload canceled.');
      error.name = 'AbortError';
      reject(error);
    });

    onRequest?.(request);
    request.send(formData);
  });

// Maps frontend media types to the backend's MessageTypes
export const getBackendMessageType = (type: string): string => {
  if (type === 'voice') return 'audio';
  if (type === 'file') return 'document';
  return type;
};

export const getMediaTypeFromFile = (file: File): string => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'voice';
  return 'file';
};

export const isAudioFile = (file?: File | { type?: string; name?: string }): boolean => {
  if (file?.type?.startsWith('audio/')) return true;
  return /\.(aac|flac|m4a|mp3|ogg|opus|wav|weba|wma)$/i.test(file?.name || '');
};

export const getMediaTypeFromMime = (mimeType?: string): string | null => {
  if (!mimeType) return null;
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'voice';
  return null;
};

export const getFileNameFromAttachmentKey = (attachmentKey?: string): string => {
  if (!attachmentKey) return '';
  const withoutUuid = attachmentKey.replace(/^[0-9a-fA-F-]{36}-/, '');
  if (!withoutUuid || withoutUuid === attachmentKey) return attachmentKey;
  return withoutUuid;
};

export const getMessageFileName = (message: any): string => {
  if (message?.file_name) return message.file_name;
  return getFileNameFromAttachmentKey(message?.attachment_key);
};

export const buildReplyPreview = (reply: any, fallbackMessageId: string | null = null): ReplyPreview | null => {
  const source = reply && typeof reply === 'object' ? reply : {};
  const messageId = getReplyMessageId(reply) || fallbackMessageId;
  if (!messageId) return null;

  const sourceType = source.type || source.message_type || '';
  const type =
    sourceType === 'file'
      ? getMediaTypeFromMime(source.mime_type) || sourceType
      : sourceType ||
        getMediaTypeFromMime(source.mime_type) ||
        (source.attachment_key ? 'document' : 'text');
  const rawContent = source.content ?? source.text ?? '';
  const content =
    typeof rawContent === 'string'
      ? rawContent.trim()
      : rawContent
      ? String(rawContent)
      : '';
  const previewText = content || getMessagePreviewText({ ...source, type, content });
  const sender =
    typeof source.sender === 'string' || typeof source.sender === 'number'
      ? source.sender
      : source.sender_name || source.sender_username || undefined;

  return {
    ...source,
    messageId: messageId.toString(),
    content: previewText,
    type: type as MessageType,
    sender,
    sender_id: source.sender_id || getSenderId(source),
    sender_info: source.sender_info,
    attachment_key: source.attachment_key || '',
    file_name: source.file_name || '',
    mime_type: source.mime_type || '',
    file_size: source.file_size || 0,
  };
};

export const getFileExtension = (fileName?: string): string => {
  const extension = fileName?.split('.').pop();
  if (!extension || extension === fileName || extension.length > 5) return 'FILE';
  return extension.toUpperCase();
};

export const mediaUrlCache = new Map<string, MediaCacheEntry>();

const MEDIA_URL_EXPIRY_MARGIN_MS = 60 * 1000;
const MEDIA_URL_FALLBACK_TTL_MS = 50 * 60 * 1000;

export const getPresignedUrlExpiry = (url: string): number => {
  try {
    const query = new URL(url, window.location.origin).searchParams;
    const expiresSeconds = Number(query.get('X-Amz-Expires'));
    const dateMatch = query
      .get('X-Amz-Date')
      ?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (expiresSeconds > 0 && dateMatch) {
      const signedAtMs = Date.UTC(
        Number(dateMatch[1]),
        Number(dateMatch[2]) - 1,
        Number(dateMatch[3]),
        Number(dateMatch[4]),
        Number(dateMatch[5]),
        Number(dateMatch[6])
      );
      return signedAtMs + expiresSeconds * 1000 - MEDIA_URL_EXPIRY_MARGIN_MS;
    }
  } catch {
    // Malformed URL — fall through to the conservative default.
  }
  return Date.now() + MEDIA_URL_FALLBACK_TTL_MS;
};

export const resolveAttachmentUrl = async (
  attachmentKey?: string,
  { forceRefresh = false }: { forceRefresh?: boolean } = {}
): Promise<string> => {
  if (!attachmentKey) return '';
  if (!forceRefresh) {
    const cached = mediaUrlCache.get(attachmentKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }
    if (cached) {
      mediaUrlCache.delete(attachmentKey);
    }
  }
  try {
    const response = await fetch('/api/v1/user/media/download', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ file_key: attachmentKey }),
    });
    if (!response.ok) {
      return '';
    }
    const data = await response.json();
    const url = data?.download_url || data?.data?.download_url || '';
    if (url) {
      mediaUrlCache.set(attachmentKey, { url, expiresAt: getPresignedUrlExpiry(url) });
    }
    return url;
  } catch (error) {
    console.error('Failed to resolve media URL:', error);
    return '';
  }
};

export const MEDIA_PREVIEW_RANGE_END = 256 * 1024 - 1;

export const getRenderableMediaType = (message: any): string => {
  const messageType = message?.type || '';
  return messageType === 'file'
    ? getMediaTypeFromMime(message?.mime_type) || 'file'
    : messageType;
};

export const resolveAttachmentPreview = async (
  attachmentKey: string,
  mediaType: string
): Promise<string> => {
  const url = await resolveAttachmentUrl(attachmentKey);
  if (!url) return '';

  if (mediaType === 'video') return url;

  try {
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${MEDIA_PREVIEW_RANGE_END}` },
    });
    if (!response.ok || response.status !== 206) return '';
    const blob = await response.blob();
    if (!blob.size) return '';

    const previewUrl = URL.createObjectURL(blob);
    if (mediaType !== 'gif') return previewUrl;

    try {
      const image = new Image();
      image.src = previewUrl;
      if (typeof image.decode === 'function') {
        await image.decode();
      } else {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
        });
      }

      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error('GIF preview has no decodable frame.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Unable to create GIF preview canvas.');
      context.drawImage(image, 0, 0);
      const stillBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
      if (!stillBlob) throw new Error('Unable to encode GIF preview.');

      URL.revokeObjectURL(previewUrl);
      return URL.createObjectURL(stillBlob);
    } catch (error) {
      console.warn('Failed to freeze GIF preview:', error);
      URL.revokeObjectURL(previewUrl);
      return '';
    }
  } catch (error) {
    console.error('Failed to resolve media preview:', error);
    return '';
  }
};

export const VISUAL_MEDIA_TYPES = ['image', 'gif', 'sticker', 'video'];

export const waitForVisualMediaReady = (url: string, mediaType: string): Promise<void> => {
  if (!url || !VISUAL_MEDIA_TYPES.includes(mediaType)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let element: HTMLImageElement | HTMLVideoElement | null = null;
    let settled = false;
    const timeoutId = window.setTimeout(
      () => finish(new Error('Media took too long to prepare.')),
      30000
    );

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      if (!element) return;
      element.onload = null;
      element.onerror = null;
      if ('onloadeddata' in element) {
        (element as HTMLVideoElement).onloadeddata = null;
      }
      if (mediaType === 'video' && 'pause' in element) {
        (element as HTMLVideoElement).pause();
        element.removeAttribute('src');
        (element as HTMLVideoElement).load();
      }
    };

    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    }

    if (mediaType === 'video') {
      const video = document.createElement('video');
      element = video;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => finish();
      video.onerror = () => finish(new Error('Unable to prepare video.'));
      video.src = url;
      video.load();
      return;
    }

    const img = new Image();
    element = img;
    img.onload = () => {
      const decodePromise =
        typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve();
      decodePromise.then(() => finish());
    };
    img.onerror = () => finish(new Error('Unable to prepare media.'));
    img.src = url;
  });
};

export const sniffImageDimensions = (url: string): Promise<MediaDimensions | null> =>
  new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => {
      resolve(
        image.naturalWidth && image.naturalHeight
          ? { width: image.naturalWidth, height: image.naturalHeight }
          : null
      );
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });

export const sniffVideoDimensions = (url: string): Promise<MediaDimensions | null> =>
  new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    let settled = false;
    const timeoutId = window.setTimeout(() => finish(null), 15000);
    const finish = (value: MediaDimensions | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute('src');
      video.load();
      resolve(value);
    };
    video.onloadedmetadata = () => {
      finish(
        video.videoWidth && video.videoHeight
          ? { width: video.videoWidth, height: video.videoHeight }
          : null
      );
    };
    video.onerror = () => finish(null);
    video.src = url;
  });

export const sniffMediaDimensions = (
  url: string,
  mediaType: string
): Promise<MediaDimensions | null> =>
  mediaType === 'video' ? sniffVideoDimensions(url) : sniffImageDimensions(url);

export const MEDIA_BOX_CAPS: Record<string, { width: number; height: number }> = {
  image: { width: 390, height: 440 },
  gif: { width: 390, height: 440 },
  video: { width: 390, height: 440 },
};

export const getLockedMediaBox = (
  dimensions: MediaDimensions | null,
  mediaType: string
): LockedMediaBox | null => {
  if (!dimensions?.width || !dimensions?.height) return null;
  const cap = MEDIA_BOX_CAPS[mediaType] || MEDIA_BOX_CAPS.image;
  const aspectRatio = dimensions.width / dimensions.height;
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return null;
  let width = cap.width;
  let height = width / aspectRatio;
  if (height > cap.height) {
    height = cap.height;
    width = height * aspectRatio;
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return {
    width: Math.round(width),
    height: Math.round(height),
    aspectRatio: `${dimensions.width} / ${dimensions.height}`,
  };
};

