import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faEllipsisVertical,
  faTimes,
  faAddressBook,
  faPlus,
  faFile as faFileSolid,
  faLocationDot,
  faTrash,
  faPen,
  faCheck,
  faXmark,
  faReply,
  faClock,
  faCircleExclamation,
  faMicrophone,
  faStop,
  faArrowLeft,
  faArrowDown,
  faBars,
  faDownload,
  faPaperclip,
  faImage,
  faVideo,
  faMusic,
  faCompactDisc,
  faFileLines,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import { Sidebar, MobileMenu, Input, ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import toast from 'react-hot-toast';
import { useSocket } from '@/shared/state/useSocket';
import { SOCKET_EVENTS } from '@/shared/state/socketEvents';
import sentIcon from "@/shared/assets/icons/sent.svg";
import seenIcon from "@/shared/assets/icons/seen.svg";
import sendIcon from "@/shared/assets/icons/sendIcon.svg";
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
import { wallpapers, WALLPAPER_STORAGE_KEY } from '@/shared/utils/wallpapers';
import {
  getMessageSize,
  getMessageSizeOption,
  MESSAGE_SIZE_KEY,
} from '@/shared/utils/messagePreferences';
import {
  getAutoDownloadMedia,
  MEDIA_AUTO_DOWNLOAD_KEY,
} from '@/shared/utils/mediaPreferences';
import NewConversationModal from '../../components/NewConversationModal/NewConversationModal';
import { AudioPlayer, VideoPlayer } from '../../components/MediaContent';
import styles from './Chat.module.css';

// Constants
const monoIcons = [
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

const GIPHY_API_KEY = '4vT03C5NJwyvvo3NF8iWEXBN1Y6FwV3G';
const GIPHY_LIMIT = 18;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_MEDIA_BATCH = 10;
const MESSAGES_LIMIT = 10; // Max number of messages per request
const MAX_MESSAGE_LENGTH = 255;

const createOptimisticId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `optimistic-${crypto.randomUUID()}`;
  }
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// Helper functions
const convertISOtoLocal = (isoDate) => {
  try {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "";
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const truncateMessage = (text, maxLength = 25) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

const formatDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = seconds.toString().padStart(2, '0');
  return `${minutes}:${paddedSeconds}`;
};

const getMessagePreviewText = (message) => {
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

const isEmojiOnlyMessage = (text) => {
  const normalized = text?.trim();
  if (!normalized) return false;
  return /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+$/u.test(normalized);
};

const getConversationId = (conversation) =>
  conversation?._id
  || conversation?.id
  || conversation?.conversation_id
  || conversation?.conversationId;
const getMessageId = (message) => message?._id || message?.id;
const getMessageMediaUrl = (message) =>
  message?.file_url
  || message?.media_url
  || message?.url
  || message?.fileUrl
  || message?.mediaUrl
  || message?.preview_url
  || message?.local_preview
  || '';
const getSenderId = (message) =>
  message?.sender_id
  || message?.sender?._id
  || message?.sender
  || message?.user_id
  || message?.from_user_id;
const getSeenByMap = (message) => {
  const seenBy = message?.seen_by || message?.seenBy;
  if (!seenBy || typeof seenBy !== 'object') return null;
  return seenBy;
};
const hasSeenByOtherUser = (seenBy, currentUserId) =>
  Object.keys(seenBy || {}).some((key) => key && key !== currentUserId && key !== 'sender');
const resolveMessageSeen = (message, chat, currentUserId) => {
  if (typeof message?.seen === 'boolean') return message.seen;
  const seenBy = getSeenByMap(message);
  if (!seenBy || !currentUserId) return false;

  const senderId = getSenderId(message)?.toString();
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
const normalizeMessage = (message, chat, currentUserId) => {
  const existingReply = message?.reply_to
    || message?.replyTo
    || message?.reply_to_message;
  const repliedTo = message?.replied_to;
  const replyPreview = existingReply || (repliedTo
    ? {
        messageId: repliedTo?._id || repliedTo?.id || null,
        content: repliedTo?.content || repliedTo?.text || '',
        type: repliedTo?.type || 'text',
        sender: repliedTo?.sender || repliedTo?.sender_id || repliedTo?.sender_name,
      }
    : null);

  return {
    ...message,
    reply_to: replyPreview || message?.reply_to,
    seen: resolveMessageSeen(message, chat, currentUserId),
  };
};

const uploadMediaFile = (file, { onProgress, onRequest } = {}) => new Promise((resolve, reject) => {
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
const getBackendMessageType = (type) => {
  if (type === 'voice') return 'audio';
  if (type === 'file') return 'document';
  return type;
};

const getMediaTypeFromFile = (file) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'voice';
  return 'file';
};

const isAudioFile = (file) => {
  if (file?.type?.startsWith('audio/')) return true;
  return /\.(aac|flac|m4a|mp3|ogg|opus|wav|weba|wma)$/i.test(file?.name || '');
};

const getMediaTypeFromMime = (mimeType) => {
  if (!mimeType) return null;
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'voice';
  return null;
};

// Extracts the original file name from an attachment_key.
// Backend stores keys as: `<uuid>-<filename>.<ext>` (e.g. "abc-123-report.pdf").
// We strip the leading UUID + dash to recover the real file name.
const getFileNameFromAttachmentKey = (attachmentKey) => {
  if (!attachmentKey) return '';
  // Strip the leading UUID segment (anything up to and including the first dash).
  const withoutUuid = attachmentKey.replace(/^[0-9a-fA-F-]{36}-/, '');
  if (!withoutUuid || withoutUuid === attachmentKey) return attachmentKey;
  return withoutUuid;
};

// Resolves the display file name for a message, preferring an explicit
// file_name field, then falling back to parsing it from attachment_key.
const getMessageFileName = (message) => {
  if (message?.file_name) return message.file_name;
  return getFileNameFromAttachmentKey(message?.attachment_key);
};

const getFileExtension = (fileName) => {
  const extension = fileName?.split('.').pop();
  if (!extension || extension === fileName || extension.length > 5) return 'FILE';
  return extension.toUpperCase();
};

// Cache of attachment_key -> pre-signed download URL
const mediaUrlCache = new Map();

// Resolves a message's attachment_key to a downloadable pre-signed URL
// using the backend media download endpoint.
const resolveAttachmentUrl = async (attachmentKey) => {
  if (!attachmentKey) return '';
  if (mediaUrlCache.has(attachmentKey)) {
    return mediaUrlCache.get(attachmentKey);
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
      mediaUrlCache.set(attachmentKey, url);
    }
    return url;
  } catch (error) {
    console.error('Failed to resolve media URL:', error);
    return '';
  }
};

const MEDIA_PREVIEW_RANGE_END = 256 * 1024 - 1;

const getRenderableMediaType = (message) => {
  const messageType = message?.type || '';
  return messageType === 'file'
    ? (getMediaTypeFromMime(message?.mime_type) || 'file')
    : messageType;
};

// Visual manual-download previews use the beginning of the actual file. The
// signed URL is still kept out of the rendered media until the user chooses
// to load it, so the full asset is not eagerly downloaded.
const resolveAttachmentPreview = async (attachmentKey, mediaType) => {
  const url = await resolveAttachmentUrl(attachmentKey);
  if (!url) return '';

  // Video containers commonly keep their metadata at the end of the file;
  // letting the browser request metadata gives it a real first frame without
  // forcing the complete video into memory.
  if (mediaType === 'video') return url;

  try {
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${MEDIA_PREVIEW_RANGE_END}` },
    });
    if (!response.ok || response.status !== 206) return '';
    const blob = await response.blob();
    return blob.size > 0 ? URL.createObjectURL(blob) : '';
  } catch (error) {
    console.error('Failed to resolve media preview:', error);
    return '';
  }
};

function ChatsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId: routeConversationId } = useParams();
  const { user } = useAuth();
  const { socket, status: socketStatus } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [hasLoadedContacts, setHasLoadedContacts] = useState(false);
  const contactsRef = useRef([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  // Per-message upload progress (optimisticId -> 0..100) for media messages
  const [mediaUploadProgress, setMediaUploadProgress] = useState({});
  const [pendingMediaItems, setPendingMediaItems] = useState([]);
  const [selectedPendingMediaId, setSelectedPendingMediaId] = useState(null);
  const [mediaViewer, setMediaViewer] = useState(null);
  const [autoDownloadMedia, setAutoDownloadMedia] = useState(getAutoDownloadMedia);
  const autoDownloadMediaRef = useRef(autoDownloadMedia);
  const [manualMediaLoading, setManualMediaLoading] = useState({});
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, conversationId: null });
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [messageDeleteConfirm, setMessageDeleteConfirm] = useState({ open: false, message: null });
  const [deleteMessageForEveryone, setDeleteMessageForEveryone] = useState(false);
  const [conversationContextMenu, setConversationContextMenu] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState('gifs');
  const [gifQuery, setGifQuery] = useState('');
  const [giphyGifs, setGiphyGifs] = useState([]);
  const [isGiphyLoading, setIsGiphyLoading] = useState(false);
  const [giphyError, setGiphyError] = useState('');
  const [deleteLastMessageAlert, setDeleteLastMessageAlert] = useState({
    open: false,
    message: null,
    contactName: '',
  });
  const [wallpaperId, setWallpaperId] = useState(() => {
    if (typeof window === 'undefined') {
      return 'aurora';
    }
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'aurora';
  });
  const [messageSize, setMessageSize] = useState(getMessageSize);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [messageContextMenu, setMessageContextMenu] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [randomIcon, setRandomIcon] = useState(null);
  const [lastAnimatedMessageId, setLastAnimatedMessageId] = useState(null);
  const selectedChatIdStr = useMemo(
    () => getConversationId(selectedChat)?.toString() || null,
    [selectedChat]
  );

  useEffect(() => {
    const syncMediaPreferences = (event) => {
      const changedKey = event?.detail?.key || event?.key;
      if (!changedKey || changedKey === MEDIA_AUTO_DOWNLOAD_KEY) {
        setAutoDownloadMedia(getAutoDownloadMedia());
      }
      if (!changedKey || changedKey === MESSAGE_SIZE_KEY) {
        setMessageSize(getMessageSize());
      }
    };

    window.addEventListener('storage', syncMediaPreferences);
    window.addEventListener('media-preferences-change', syncMediaPreferences);
    window.addEventListener('message-preferences-change', syncMediaPreferences);
    return () => {
      window.removeEventListener('storage', syncMediaPreferences);
      window.removeEventListener('media-preferences-change', syncMediaPreferences);
      window.removeEventListener('message-preferences-change', syncMediaPreferences);
    };
  }, []);

  const optionsMenuRef = useRef(null);
  const chatMenuRef = useRef(null);
  const mediaPickerRef = useRef(null);
  const messageRefs = useRef(new Map());
  const refreshTimeoutsRef = useRef([]);
  const messagesEndRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);
    const isNearBottomRef = useRef(true);
  const animatedMessageIdsRef = useRef(new Set());
  const pendingPvRef = useRef(null);
  const pendingPvMediaCreationsRef = useRef(new Map());
  const pendingPvMediaCreationQueueRef = useRef(Promise.resolve());
  const pendingMessagesRef = useRef({});
  const pendingSendMapRef = useRef({});
  const pendingReplyMapRef = useRef({});
  const pendingAckTimersRef = useRef({});
  const mediaUploadRequestsRef = useRef(new Map());
  const mediaUploadTasksRef = useRef(new Map());
  const sendMediaMessageRef = useRef(null);
  const isDispatchingPendingMediaRef = useRef(false);
  const recentReceiveRef = useRef({});
  const seenSentRef = useRef({});
  const messageAnimationTimeoutRef = useRef(null);
  const pendingEditRef = useRef(null);
  const pendingDeleteRef = useRef(new Map());
  const deleteConversationTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const statusOfflineTimersRef = useRef({});
  const longPressTimeoutRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const messageContextMenuRef = useRef(null);
  const conversationAliasRef = useRef(new Map());
  const previousSelectedChatIdRef = useRef(null);

  const [unreadCounts, setUnreadCounts] = useState({});
  const unreadCountsRef = useRef({});
  const hasFetchedContactsRef = useRef(false);
  // Mobile responsive states
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(() => {
    // If arriving via a deep link, open the chat pane immediately
    // so it doesn't slide in from the right on first render.
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get('startUser') || window.location.pathname !== '/chats');
  });
  // Whether the conversation pane is actually on screen right now.
  // On desktop (>768px) both panes render side-by-side, so it's always visible.
  // On mobile the chat list and the conversation swap places, driven by isMobileChatOpen.
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => window.matchMedia('(max-width: 768px)').matches
  );
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => setIsMobileViewport(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  const isChatViewVisible = !isMobileViewport || isMobileChatOpen;
  const isChatViewVisibleRef = useRef(isChatViewVisible);
  useEffect(() => {
    isChatViewVisibleRef.current = isChatViewVisible;
  }, [isChatViewVisible]);
  const isAtBottomRef = useRef(false);
  const isJumpingToLatestRef = useRef(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const startConversationRef = useRef(null);
  const deleteTargetName = useMemo(() => {
    if (!deleteConfirm.open || !deleteConfirm.conversationId) {
      return '';
    }
    const chat = contacts.find(
      (c) => getConversationId(c)?.toString() === deleteConfirm.conversationId
    );
    if (!chat) {
      return '';
    }
    if (chat.type === 'group') {
      return chat.group_name || 'this group';
    }
    return chat.contact_info?.username || 'contact';
  }, [deleteConfirm.conversationId, deleteConfirm.open, contacts]);
  
  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = messagesEndRef.current;
    const container = messagesContainerRef.current;
    if (container) {
      if (behavior === 'smooth') {
        container.scrollTo({ top: container.scrollHeight, behavior });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    } else if (el) {
      el.scrollIntoView({ behavior, block: 'end' });
    }
    isNearBottomRef.current = true;
    isAtBottomRef.current = true;
    setShowJumpToLatest(false);
  }, []);

  const handleJumpToLatest = useCallback(() => {
    isJumpingToLatestRef.current = true;
    scrollToBottom('smooth');
  }, [scrollToBottom]);

  const scrollToMessage = useCallback((messageId) => {
    if (!messageId) return;
    const target = messageRefs.current.get(messageId.toString());
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        target.classList.add(styles.messageHighlight);
        setTimeout(() => {
          target.classList.remove(styles.messageHighlight);
        }, 1400);
      }, 350);
    }
  }, []);

  const handleSelectChat = useCallback((chat) => {
    const conversationId = getConversationId(chat);
    if (!conversationId) return;
    setSelectedChat(chat);
    setIsMobileChatOpen(true);
    navigate(`/chats/${encodeURIComponent(conversationId.toString())}`);
  }, [navigate]);

  const handleCloseChat = useCallback(() => {
    setSelectedChat(null);
    setIsMobileChatOpen(false);
    navigate('/chats');
  }, [navigate]);

  const setConversationAlias = useCallback((tempId, realId) => {
    if (!tempId || !realId) return;
    const tempStr = tempId.toString();
    const realStr = realId.toString();
    if (!tempStr || !realStr) return;
    conversationAliasRef.current.set(tempStr, realStr);
    conversationAliasRef.current.set(realStr, realStr);
  }, []);

  const promotePendingConversation = useCallback((tempId, realId) => {
    if (!tempId || !realId) return;

    const tempIdStr = tempId.toString();
    const realIdStr = realId.toString();
    setConversationAlias(tempIdStr, realIdStr);

    setContacts((currentContacts) => currentContacts.map((chat) => (
      getConversationId(chat)?.toString() === tempIdStr
        ? {
            ...chat,
            _id: realIdStr,
            id: realIdStr,
            client_id: chat.client_id || getConversationId(chat),
          }
        : chat
    )));
    setSelectedChat((currentChat) => (
      currentChat && getConversationId(currentChat)?.toString() === tempIdStr
        ? { ...currentChat, _id: realIdStr, id: realIdStr }
        : currentChat
    ));
    setMessages((currentMessages) => currentMessages.map((message) => (
      message.conversation_id?.toString() === tempIdStr
        ? { ...message, conversation_id: realIdStr }
        : message
    )));
    setMessagesConversationId((currentId) => (
      currentId?.toString() === tempIdStr ? realIdStr : currentId
    ));

    Object.values(pendingSendMapRef.current).forEach((pendingMessage) => {
      if (pendingMessage?.conversationId?.toString() === tempIdStr) {
        pendingMessage.conversationId = realIdStr;
      }
    });
    Object.values(pendingReplyMapRef.current).forEach((pendingMessage) => {
      if (pendingMessage?.conversationId?.toString() === tempIdStr) {
        pendingMessage.conversationId = realIdStr;
      }
    });
    mediaUploadTasksRef.current.forEach((task) => {
      if (task?.conversationId?.toString() === tempIdStr) {
        task.conversationId = realIdStr;
      }
    });
    if (
      routeConversationId?.toString() === tempIdStr
      || getConversationId(selectedChatRef.current)?.toString() === tempIdStr
    ) {
      navigate(`/chats/${encodeURIComponent(realIdStr)}`, { replace: true });
    }
  }, [navigate, routeConversationId, setConversationAlias]);

  const handleSendMessage = useCallback(() => {
    const content = messageInput.trim();
    if (!content) {
      return;
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    if (!selectedChat) {
      toast.error('Please select a chat first.');
      return;
    }

    const conversationId = getConversationId(selectedChat);
    if (!conversationId) {
      toast.error('Invalid conversation.');
      return;
    }

    const isPendingPv = selectedChat?.type === 'pv'
      && conversationId.toString().startsWith('temp-');
    const contactUserId = selectedChat?.contact_info?._id
      || selectedChat?.contact_info?.id;

    // Clear reply immediately to avoid UI sticking around if socket emits fail.
    setReplyingToMessage(null);

    const optimisticId = `optimistic-${Date.now()}`;
    const replyTo = replyingToMessage
      ? {
          messageId: getMessageId(replyingToMessage),
          content: replyingToMessage?.content
            || replyingToMessage?.text
            || getMessagePreviewText(replyingToMessage),
          sender: replyingToMessage?.sender,
        }
      : null;
    const optimisticMessage = {
      _id: optimisticId,
      id: optimisticId,
      client_id: optimisticId,
      conversation_id: conversationId,
      sender: user?._id || user?.id,
      type: 'text',
      content,
      created_at: new Date().toISOString(),
      edited: false,
      reply_to: replyTo,
      status: 'pending',
      seen: false,
    };

    animatedMessageIdsRef.current.add(optimisticId);
    setLastAnimatedMessageId(optimisticId);
    if (messageAnimationTimeoutRef.current) {
      clearTimeout(messageAnimationTimeoutRef.current);
    }
    messageAnimationTimeoutRef.current = setTimeout(() => {
      setLastAnimatedMessageId(null);
    }, 600);
    if (replyTo) {
      pendingReplyMapRef.current[optimisticId] = {
        tempId: optimisticId,
        conversationId: conversationId.toString(),
        replyToId: replyTo.messageId,
      };
      if (pendingAckTimersRef.current[optimisticId]) {
        clearTimeout(pendingAckTimersRef.current[optimisticId]);
      }
      pendingAckTimersRef.current[optimisticId] = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            getMessageId(m) === optimisticId ? { ...m, status: 'error' } : m
          )
        );
      }, 60000);
    } else {
      pendingSendMapRef.current[optimisticId] = {
        tempId: optimisticId,
        conversationId: conversationId.toString(),
      };
      if (pendingAckTimersRef.current[optimisticId]) {
        clearTimeout(pendingAckTimersRef.current[optimisticId]);
      }
      pendingAckTimersRef.current[optimisticId] = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            getMessageId(m) === optimisticId ? { ...m, status: 'error' } : m
          )
        );
      }, 60000);
    }

    const conversationIdStr = conversationId.toString();
    setContacts((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c) => getConversationId(c)?.toString() === conversationIdStr);
      if (idx === -1) return prev;

      const chat = next[idx];
      next[idx] = {
        ...chat,
        last_message: {
          content,
          type: 'text',
          sender: user?.username || chat?.last_message?.sender || '',
          when: optimisticMessage.created_at,
          message_id: optimisticId,
          sender_id: user?._id || user?.id,
        },
      };

      const [moved] = next.splice(idx, 1);
      next.unshift(moved);
      return next;
    });

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');
    shouldAutoScrollRef.current = true;
    setMessagesConversationId(conversationId.toString());
    scrollToBottom();

    try {
      if (!socket || !socket.connected) {
        toast.error('Not connected.');
        return;
      }

      if (isPendingPv && !contactUserId) {
        toast.error('Unable to start this conversation.');
        return;
      }

      if (isPendingPv && contactUserId) {
        const pendingMediaCreation = pendingPvMediaCreationsRef.current.get(
          conversationId.toString()
        );
        if (pendingMediaCreation) {
          void pendingMediaCreation.conversationPromise
            .then((resolvedConversationId) => {
              if (!socket || !socket.connected) {
                throw new Error('Not connected.');
              }
              if (pendingSendMapRef.current[optimisticId]) {
                pendingSendMapRef.current[optimisticId].conversationId = resolvedConversationId;
              }
              if (pendingReplyMapRef.current[optimisticId]) {
                pendingReplyMapRef.current[optimisticId].conversationId = resolvedConversationId;
              }
              if (replyTo) {
                socket.emit(SOCKET_EVENTS.MESSAGE_SEND_REPLY, {
                  conversation_id: resolvedConversationId,
                  message_text: content,
                  reply_to: replyTo.messageId,
                  track_id: optimisticId,
                  message_type: 'text',
                });
                return;
              }
              socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
                conversation_id: resolvedConversationId,
                message_text: content,
                track_id: optimisticId,
                message_type: 'text',
              });
            })
            .catch((error) => {
              console.error('Failed to send message after creating conversation:', error);
              delete pendingSendMapRef.current[optimisticId];
              delete pendingReplyMapRef.current[optimisticId];
              if (pendingAckTimersRef.current[optimisticId]) {
                clearTimeout(pendingAckTimersRef.current[optimisticId]);
                delete pendingAckTimersRef.current[optimisticId];
              }
              setMessages((currentMessages) => currentMessages.map((message) => (
                getMessageId(message) === optimisticId
                  ? { ...message, status: 'error' }
                  : message
              )));
              toast.error('Unable to send message right now.');
            });
          return;
        }

        pendingPvRef.current = {
          tempId: conversationId,
          contactUserId,
          trackId: optimisticId,
          messageText: content,
        };
        socket.emit(
          SOCKET_EVENTS.NEW_PV_CONVERSATION,
          {
            new_user_id: contactUserId,
            message_text: content,
            date: new Date().toISOString(),
            track_id: optimisticId,
            message_type: 'text',
          },
          (ack) => {
            if (!ack?.ok) {
              toast.error(ack?.error || 'Unable to send message.');
              return;
            }

            const newConversationId = ack?.conversationId || ack?.conversation?._id || ack?.conversation?.id;
            if (newConversationId) {
              setConversationAlias(conversationId, newConversationId);
              setContacts((prev) =>
                prev.map((chat) =>
                  getConversationId(chat) === conversationId
                    ? {
                        ...chat,
                        _id: newConversationId,
                        id: newConversationId,
                        client_id: chat.client_id || getConversationId(chat),
                      }
                    : chat
                )
              );
              setSelectedChat((prev) =>
                prev && getConversationId(prev) === conversationId
                  ? { ...prev, _id: newConversationId, id: newConversationId }
                  : prev
              );
              setMessages((prev) =>
                prev.map((m) =>
                  m.conversation_id === conversationId
                    ? { ...m, conversation_id: newConversationId }
                    : m
                )
              );
              setMessagesConversationId(newConversationId);
            } else {
              refreshContacts();
            }

            const serverMessage = ack?.message;
            const serverMessageId = getMessageId(serverMessage);
            if (!serverMessage || !serverMessageId) {
              return;
            }

            setMessages((prev) =>
              prev.map((m) => {
                const mid = getMessageId(m);
                if (mid === optimisticId) {
                  return { ...serverMessage, client_id: m.client_id || optimisticId };
                }
                return m;
              })
            );
          }
        );
        return;
      }

      if (replyTo) {
        socket.emit(
          SOCKET_EVENTS.MESSAGE_SEND_REPLY,
          {
            conversation_id: conversationId.toString(),
            message_text: content,
            reply_to: replyTo.messageId,
            track_id: optimisticId,
            message_type: 'text',
          }
        );
      } else {
        socket.emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          {
            conversation_id: conversationId,
            message_text: content,
            track_id: optimisticId,
            message_type: 'text',
          }
        );
      }
    } catch (err) {
      console.error('Failed to emit socket message:', err);
      toast.error('Unable to send message right now.');
    }
  }, [
    messageInput,
    replyingToMessage,
    scrollToBottom,
    selectedChat,
    setConversationAlias,
    socket,
    user?.id,
  ]);

  const handleEditSubmit = useCallback(() => {
    const content = messageInput.trim();
    const msg = editingMessage;
    if (!msg) return;
    if (!content) {
      toast.error('Message cannot be empty.');
      return;
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    const messageId = getMessageId(msg);
    const conversationId = getConversationId(selectedChat);
    if (!socket || !socket.connected || !messageId || !conversationId) {
      toast.error('Not connected.');
      return;
    }

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => (getMessageId(m) === messageId ? { ...m, content, edited: true } : m))
    );

    pendingEditRef.current = {
      messageId,
      previousContent: msg?.content || msg?.text || '',
    };

    socket.emit(SOCKET_EVENTS.MESSAGE_EDIT, {
      message_id: messageId,
      new_message: content,
    });

    setEditingMessage(null);
    setMessageInput('');
  }, [editingMessage, messageInput, selectedChat, socket]);

  const handleEditCancel = useCallback(() => {
    setEditingMessage(null);
    setMessageInput('');
  }, []);

  const performDeleteMessage = useCallback(
    (message, scope = 'me') => {
      const messageId = getMessageId(message);
      if (!messageId) return;

      // Optimistic remove
      setMessages((prev) => {
        const index = prev.findIndex((m) => getMessageId(m) === messageId);
        if (index !== -1) {
          const isLastMessage = index === prev.length - 1;
          const nextLastMessage = isLastMessage ? prev[prev.length - 2] : null;
          const conversationId = (prev[index]?.conversation_id || prev[index]?.conversationId)?.toString()
            || getConversationId(selectedChatRef.current)?.toString();
          const previousLastMessage = conversationId
            ? contactsRef.current.find(
                (chat) => getConversationId(chat)?.toString() === conversationId
              )?.last_message
            : null;
          pendingDeleteRef.current.set(messageId.toString(), {
            message: prev[index],
            index,
            conversationId,
            wasLast: isLastMessage,
            nextLastMessage,
            previousLastMessage,
          });
        }
        return prev.filter((m) => getMessageId(m) !== messageId);
      });
      setMessageContextMenu(null);

      if (!socket || !socket.connected) {
        toast.error('Not connected.');
        return;
      }

      if (scope === 'all') {
        socket.emit(SOCKET_EVENTS.MESSAGE_DELETE_FOR_ALL, {
          message_id: messageId,
        });
      } else {
        socket.emit(SOCKET_EVENTS.MESSAGE_DELETE_FOR_ME, {
          message_id: messageId,
        });
      }
    },
    [selectedChat, socket]
  );

  const handleDeleteMessage = useCallback(
    (message) => {
      if (!message) return;
      const activeConversationIdStr = activeConversationIdRef.current?.toString();
      const messageConversationId = (message?.conversation_id || message?.conversationId)?.toString();
      const conversationIdStr = messageConversationId || activeConversationIdStr;
      const isActiveConversation = conversationIdStr
        && activeConversationIdStr
        && conversationIdStr === activeConversationIdStr;
      const totalMessages = isActiveConversation ? messagesRef.current.length : 0;
      const isOnlyMessage = isActiveConversation && totalMessages === 1;
      const contactName = selectedChatRef.current?.type === 'pv'
        ? (selectedChatRef.current?.contact_info?.username || 'contact')
        : (selectedChatRef.current?.group_name || 'this conversation');

      if (isOnlyMessage) {
        setDeleteLastMessageAlert({
          open: true,
          message,
          contactName,
        });
        setMessageContextMenu(null);
        return;
      }

      // Ask the user whether to delete for themselves or for everyone
      setMessageDeleteConfirm({ open: true, message });
      setDeleteMessageForEveryone(false);
      setMessageContextMenu(null);
    },
    []
  );

  const handleConfirmDeleteMessage = useCallback(() => {
    if (messageDeleteConfirm?.message) {
      performDeleteMessage(
        messageDeleteConfirm.message,
        deleteMessageForEveryone ? 'all' : 'me'
      );
    }
    setMessageDeleteConfirm({ open: false, message: null });
    setDeleteMessageForEveryone(false);
  }, [messageDeleteConfirm, deleteMessageForEveryone, performDeleteMessage]);

  const handleCancelDeleteMessage = useCallback(() => {
    setMessageDeleteConfirm({ open: false, message: null });
    setDeleteMessageForEveryone(false);
  }, []);

  const handleConfirmDeleteLastMessage = useCallback(() => {
    if (deleteLastMessageAlert?.message) {
      performDeleteMessage(deleteLastMessageAlert.message);
    }
    setDeleteLastMessageAlert({ open: false, message: null, contactName: '' });
  }, [deleteLastMessageAlert, performDeleteMessage]);

  const handleCancelDeleteLastMessage = useCallback(() => {
    setDeleteLastMessageAlert({ open: false, message: null, contactName: '' });
  }, []);

  const handleReplyToMessage = useCallback((message) => {
    setReplyingToMessage(message);
    setMessageContextMenu(null);
  }, []);

  const handleDownloadMessage = useCallback(async (message) => {
    if (!message) return;
    setMessageContextMenu(null);
    let url = getMessageMediaUrl(message);
    if (!url && message?.attachment_key) {
      url = await resolveAttachmentUrl(message.attachment_key);
    }
    if (!url) {
      toast.error('File is not ready yet.');
      return;
    }
    const fileName = getMessageFileName(message) || 'attachment';
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Failed to download media:', error);
      window.open(url, '_blank');
    }
  }, []);

  const handleResendMessage = useCallback((message) => {
    const conversationId = message?.conversation_id;
    const content = message?.content || message?.text;
    if (!conversationId) {
      toast.error('Unable to resend message.');
      return;
    }

    if (!socket || !socket.connected) {
      toast.error('Not connected.');
      return;
    }

    const messageId = getMessageId(message);
    const replyToId = message?.reply_to?.messageId
      || message?.reply_to?.message_id
      || message?.reply_to
      || message?.replyTo?.messageId
      || null;
    const attachmentKey = message?.attachment_key;
    const messageType = message?.type || 'text';
    const mediaTask = messageId
      ? mediaUploadTasksRef.current.get(messageId.toString())
      : null;
    const isMedia = Boolean(attachmentKey || message?.local_preview || mediaTask);

    if (isMedia && messageId) {
      if (mediaTask && sendMediaMessageRef.current) {
        void sendMediaMessageRef.current({
          file: mediaTask.file || null,
          prepareFile: mediaTask.prepareFile,
          type: mediaTask.type || messageType,
          previewUrl: mediaTask.previewUrl || message?.local_preview,
          caption: mediaTask.caption ?? content ?? '',
          replyTo: mediaTask.replyTo,
          fileName: mediaTask.fileName || message?.file_name,
          mimeType: mediaTask.mimeType || message?.mime_type,
          fileSize: mediaTask.fileSize || message?.file_size,
          attachmentKey: mediaTask.attachmentKey || '',
          optimisticId: messageId,
        });
        return;
      }
    }

    if (messageId) {
      setMessages((prev) =>
        prev.map((m) =>
          getMessageId(m) === messageId ? { ...m, status: 'pending' } : m
        )
      );
      if (replyToId) {
        pendingReplyMapRef.current[messageId] = {
          tempId: messageId,
          conversationId: conversationId.toString(),
          replyToId,
        };
        if (pendingAckTimersRef.current[messageId]) {
          clearTimeout(pendingAckTimersRef.current[messageId]);
        }
        pendingAckTimersRef.current[messageId] = setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              getMessageId(m) === messageId ? { ...m, status: 'error' } : m
            )
          );
        }, 60000);
      } else {
        pendingSendMapRef.current[messageId] = {
          tempId: messageId,
          conversationId: conversationId.toString(),
        };
        if (pendingAckTimersRef.current[messageId]) {
          clearTimeout(pendingAckTimersRef.current[messageId]);
        }
        pendingAckTimersRef.current[messageId] = setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              getMessageId(m) === messageId ? { ...m, status: 'error' } : m
            )
          );
        }, 60000);
      }
    }

    if (isMedia) {
      socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
        conversation_id: conversationId,
        message_text: content || '',
        track_id: messageId,
        message_type: messageType,
        attachment_key: attachmentKey,
        replied_to: replyToId || null,
      });
    } else if (replyToId) {
      socket.emit(SOCKET_EVENTS.MESSAGE_SEND_REPLY, {
        conversation_id: conversationId.toString(),
        message_text: content,
        reply_to: replyToId,
        track_id: messageId,
        message_type: 'text',
      });
    } else {
      socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
        conversation_id: conversationId,
        message_text: content,
        track_id: messageId,
        message_type: 'text',
      });
    }
  }, [socket]);

  const handleOpenDeleteConversation = useCallback((conversationOverride = null) => {
    const conversationId = conversationOverride
      ? getConversationId(conversationOverride)
      : getConversationId(selectedChat);
    if (!conversationId) return;
    setDeleteConfirm({ open: true, conversationId: conversationId.toString() });
    setDeleteForEveryone(false);
    setIsChatMenuOpen(false);
    setConversationContextMenu(null);
  }, [selectedChat]);

  const handleDeleteConversation = useCallback(
    (scope) => {
      if (isDeletingConversation) return;
      const conversationId = deleteConfirm.conversationId;
      if (!conversationId) return;

      setIsDeletingConversation(true);
      if (!socket || !socket.connected) {
        toast.error('Not connected.');
        setIsDeletingConversation(false);
        return;
      }

      if (deleteConversationTimeoutRef.current) {
        clearTimeout(deleteConversationTimeoutRef.current);
      }
      deleteConversationTimeoutRef.current = setTimeout(() => {
        setIsDeletingConversation(false);
        toast.error('Delete request timed out. Please try again.');
      }, 8000);

      socket.emit(SOCKET_EVENTS.CONVERSATION_PV_DELETE, {
        conversation_id: conversationId,
        delete_for: scope,
      });
    },
    [deleteConfirm.conversationId, isDeletingConversation, socket]
  );

  // Refresh conversations list
  const refreshContacts = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/user/conversations', {
        method: "GET",
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        const serverChats = (data.conversations || []).map((chat) => {
          const id = getConversationId(chat)?.toString();
          const cachedUnread = id ? unreadCountsRef.current[id] : 0;
          const serverUnread = chat.unread_messages_count ?? chat.unread_count ?? 0;
          const existing = id
            ? contactsRef.current.find(
                (c) => getConversationId(c)?.toString() === id
              )
            : null;
          const existingByContact = !existing && chat.type === 'pv'
            ? contactsRef.current.find((c) => {
                if (c.type !== 'pv') return false;
                const contactId = (c.contact_info?._id || c.contact_info?.id)?.toString();
                const serverContactId = (chat.contact_info?._id || chat.contact_info?.id)?.toString();
                return contactId && serverContactId && contactId === serverContactId;
              })
            : null;
          const mergedExisting = existing || existingByContact;
          const serverLast = chat?.last_message;
          const existingLast = mergedExisting?.last_message;
          const serverHasLast = Boolean(
            serverLast?.content || serverLast?.text || serverLast?.when || serverLast?.message_id || serverLast?._id || serverLast?.id
          );
          const existingHasLast = Boolean(
            existingLast?.content || existingLast?.text || existingLast?.when || existingLast?.message_id || existingLast?._id || existingLast?.id
          );
          const serverText = serverLast?.content || serverLast?.text || '';
          const existingText = existingLast?.content || existingLast?.text || '';
          const serverTime = new Date(serverLast?.when || serverLast?.created_at || 0).getTime();
          const existingTime = new Date(existingLast?.when || existingLast?.created_at || 0).getTime();
          const keepExistingWhen = serverHasLast
            && existingHasLast
            && serverText
            && existingText
            && serverText === existingText
            && existingTime
            && serverTime
            && existingTime > serverTime;
          const mergedLast = keepExistingWhen
            ? {
                ...serverLast,
                ...existingLast,
                when: existingLast?.when || serverLast?.when,
                message_id: serverLast?.message_id || serverLast?._id || serverLast?.id || existingLast?.message_id,
              }
            : serverLast;
          return {
            ...(serverHasLast || !existingHasLast
              ? { ...chat, last_message: mergedLast }
              : { ...chat, last_message: existingLast }),
            unread_messages_count: Math.max(serverUnread, cachedUnread),
            client_id: mergedExisting?.client_id || chat.client_id,
          };
        });
        setContacts((prev) => {
          const serverIds = new Set(
            serverChats.map((chat) => getConversationId(chat)?.toString()).filter(Boolean)
          );
          const selectedId = getConversationId(selectedChatRef.current)?.toString();
          const tempChats = prev.filter((chat) => {
            const id = getConversationId(chat)?.toString();
            if (!id) return false;
            const isTemp = id.startsWith('temp-');
            const missingOnServer = !serverIds.has(id);
            const isSelected = selectedId && selectedId === id;
            const hasPending = (pendingMessagesRef.current[id] || []).length > 0;
            const isEmpty = !chat.last_message?.content;
            return isTemp
              || (missingOnServer && (isEmpty || isSelected || hasPending));
          });
          const tempContactIds = new Set(
            tempChats
              .map((chat) => (chat.contact_info?._id || chat.contact_info?.id)?.toString())
              .filter(Boolean)
          );
          const filteredServerChats = tempContactIds.size === 0
            ? serverChats
            : serverChats.filter((chat) => {
                if (chat.type !== 'pv') return true;
                const contactId = (chat.contact_info?._id || chat.contact_info?.id)?.toString();
                return !contactId || !tempContactIds.has(contactId);
              });
          return [...tempChats, ...filteredServerChats];
        });
        setUnreadCounts(() => {
          const merged = { ...unreadCountsRef.current };
          serverChats.forEach((chat) => {
            const id = getConversationId(chat)?.toString();
            if (!id) return;
            const unread = chat.unread_messages_count ?? chat.unread_count ?? 0;
            if (unread > (merged[id] || 0)) {
              merged[id] = unread;
            }
          });
          unreadCountsRef.current = merged;
          return merged;
        });
        setHasLoadedContacts(true);
        return serverChats;
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
    setHasLoadedContacts(true);
    return [];
  }, []);
  
  // Messages state
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [messagesConversationId, setMessagesConversationId] = useState(null);
  // Maps message id -> resolved pre-signed media URL (from attachment_key)
  const [resolvedMediaUrls, setResolvedMediaUrls] = useState({});
  const resolvedMediaUrlsRef = useRef({});
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState({});
  const mediaPreviewUrlsRef = useRef({});
  const mediaPreviewRequestsRef = useRef(new Map());

  useEffect(() => {
    autoDownloadMediaRef.current = autoDownloadMedia;
  }, [autoDownloadMedia]);

  const loadMediaMessage = useCallback(async (message) => {
    const messageId = getMessageId(message);
    const attachmentKey = message?.attachment_key;
    if (!messageId || !attachmentKey || manualMediaLoading[messageId]) return;

    setManualMediaLoading((current) => ({ ...current, [messageId]: true }));
    try {
      const signedUrl = await resolveAttachmentUrl(attachmentKey);
      if (!signedUrl) throw new Error('Media is not available right now.');
      const mediaType = getRenderableMediaType(message);
      let url = signedUrl;

      // Audio is intentionally download-only while auto-download is disabled.
      // Fetch the complete file before exposing the player, so the play button
      // cannot start streaming a file the user has not chosen to download.
      if (['voice', 'audio'].includes(mediaType)) {
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error('Audio is not available right now.');
        const blob = await response.blob();
        url = URL.createObjectURL(blob);
      }

      const previewUrl = mediaPreviewUrlsRef.current[messageId];
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
        delete mediaPreviewUrlsRef.current[messageId];
        setMediaPreviewUrls((current) => {
          const next = { ...current };
          delete next[messageId];
          return next;
        });
      }
      const previousUrl = resolvedMediaUrlsRef.current[messageId];
      if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
      resolvedMediaUrlsRef.current[messageId] = url;
      setResolvedMediaUrls((current) => ({ ...current, [messageId]: url }));
    } catch (error) {
      toast.error(error?.message || 'Unable to load media.');
    } finally {
      setManualMediaLoading((current) => {
        const next = { ...current };
        delete next[messageId];
        return next;
      });
    }
  }, [manualMediaLoading]);
  const messagesContainerRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const messagesOffsetRef = useRef(0);
  const hasMoreMessagesRef = useRef(true);
  const isInitialLoadRef = useRef(true);
  const previousScrollTopRef = useRef(0);
  const pendingPrependRef = useRef(false);
  const loadMoreSentinelRef = useRef(null);
  const scrollFrameRef = useRef(null);

  useEffect(() => {
    messagesOffsetRef.current = messagesOffset;
  }, [messagesOffset]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Resolve pre-signed URLs for any message that has an attachment_key
  // but no resolved URL yet (received/loaded media messages).
  useEffect(() => {
    if (!autoDownloadMedia) return undefined;
    const pending = [];
    messages.forEach((message) => {
      const id = getMessageId(message);
      const key = message?.attachment_key;
      if (!id || !key) return;
      if (resolvedMediaUrlsRef.current[id]) return;
      if (message?.local_preview) return; // optimistic message already has a preview
      pending.push({ id, key });
    });
    if (pending.length === 0) return;

    let cancelled = false;
    pending.forEach(({ id, key }) => {
      resolveAttachmentUrl(key).then((url) => {
        if (cancelled || !url) return;
        resolvedMediaUrlsRef.current[id] = url;
        setResolvedMediaUrls((prev) => ({ ...prev, [id]: url }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [autoDownloadMedia, messages]);

  useEffect(() => {
    const activeMessageIds = new Set(
      messages.map((message) => getMessageId(message)?.toString()).filter(Boolean)
    );

    Object.entries(mediaPreviewUrlsRef.current).forEach(([messageId, previewUrl]) => {
      if (!activeMessageIds.has(messageId)) {
        if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        delete mediaPreviewUrlsRef.current[messageId];
        mediaPreviewRequestsRef.current.delete(messageId);
      }
    });

    Object.entries(resolvedMediaUrlsRef.current).forEach(([messageId, mediaUrl]) => {
      if (!activeMessageIds.has(messageId) && mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
        delete resolvedMediaUrlsRef.current[messageId];
      }
    });

    if (autoDownloadMedia) {
      Object.values(mediaPreviewUrlsRef.current).forEach((previewUrl) => {
        if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      });
      mediaPreviewUrlsRef.current = {};
      mediaPreviewRequestsRef.current.clear();
      setMediaPreviewUrls({});
      return undefined;
    }

    messages.forEach((message) => {
      const messageId = getMessageId(message)?.toString();
      const attachmentKey = message?.attachment_key;
      const mediaType = getRenderableMediaType(message);
      const isVisualMedia = ['image', 'gif', 'sticker', 'video'].includes(mediaType);
      if (!messageId || !attachmentKey || !isVisualMedia) return;
      if (mediaPreviewUrlsRef.current[messageId] || mediaPreviewRequestsRef.current.has(messageId)) return;

      const request = resolveAttachmentPreview(attachmentKey, mediaType)
        .then((previewUrl) => {
          if (!previewUrl || autoDownloadMediaRef.current || resolvedMediaUrlsRef.current[messageId]) {
            if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
            return;
          }
          mediaPreviewUrlsRef.current[messageId] = previewUrl;
          setMediaPreviewUrls((current) => ({ ...current, [messageId]: previewUrl }));
        })
        .finally(() => {
          mediaPreviewRequestsRef.current.delete(messageId);
        });
      mediaPreviewRequestsRef.current.set(messageId, request);
    });

    return undefined;
  }, [autoDownloadMedia, messages]);

  useEffect(() => () => {
    Object.values(mediaPreviewUrlsRef.current).forEach((previewUrl) => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    });
    mediaPreviewUrlsRef.current = {};
    mediaPreviewRequestsRef.current.clear();
    Object.values(resolvedMediaUrlsRef.current).forEach((mediaUrl) => {
      if (mediaUrl.startsWith('blob:')) URL.revokeObjectURL(mediaUrl);
    });
    resolvedMediaUrlsRef.current = {};
  }, []);

  useEffect(() => {
    hasMoreMessagesRef.current = hasMoreMessages;
  }, [hasMoreMessages]);

  useEffect(() => {
    unreadCountsRef.current = unreadCounts;
  }, [unreadCounts]);

  const setUnreadCount = useCallback((conversationIdStr, updater) => {
    if (!conversationIdStr) return;
    setUnreadCounts((prev) => {
      const current = prev[conversationIdStr] || 0;
      const nextValue = typeof updater === 'function' ? updater(current) : updater;
      const next = {
        ...prev,
        [conversationIdStr]: Math.max(0, nextValue),
      };
      unreadCountsRef.current = next;
      return next;
    });
  }, []);

  const updateContactStatus = useCallback((userId, status) => {
    if (!userId) return;
    const userIdStr = userId.toString();
    setContacts((prev) =>
      prev.map((chat) => {
        if (chat?.type !== 'pv') return chat;
        const contactId = (chat.contact_info?._id || chat.contact_info?.id)?.toString();
        if (!contactId || contactId !== userIdStr) return chat;
        if (chat.contact_info?.status === status) return chat;
        return {
          ...chat,
          contact_info: {
            ...chat.contact_info,
            status,
          },
        };
      })
    );
    setSelectedChat((prev) => {
      if (!prev || prev?.type !== 'pv') return prev;
      const contactId = (prev.contact_info?._id || prev.contact_info?.id)?.toString();
      if (!contactId || contactId !== userIdStr) return prev;
      if (prev.contact_info?.status === status) return prev;
      return {
        ...prev,
        contact_info: {
          ...prev.contact_info,
          status,
        },
      };
    });
  }, []);

  const fetchContactStatus = useCallback(async (userId) => {
    if (!userId) return;
    try {
    const cacheBuster = `cb=${Date.now()}`;
    const response = await fetch(`/api/v1/members/${userId}/info?${cacheBuster}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      const status = data?.userInfo?.status || data?.status;
      if (!status) return;
      updateContactStatus(userId, status);
    } catch (error) {
      console.error('Failed to fetch user status:', error);
    }
  }, [updateContactStatus]);

  const emitSeenForMessage = useCallback(
    (message, conversationIdStr) => {
      if (!socket || !socket.connected) return;
      if (selectedChatRef.current?.type !== 'pv') return;
      // Only mark messages as seen while the conversation pane is actually
      // visible — on mobile the pane can be "selected" but closed (chat list shown).
      if (!isChatViewVisibleRef.current) return;
      if (!message || !conversationIdStr) return;

      const messageId = getMessageId(message);
      if (!messageId) return;
      // Never emit `seen` for messages that don't have a server id yet —
      // optimistic/pending messages only exist client-side.
      if (message?.status === 'pending' || message?.status === 'error') return;
      if (typeof messageId === 'string'
        && (messageId.startsWith('optimistic-') || messageId.startsWith('receive-') || messageId.startsWith('temp-'))) {
        return;
      }
      if (message?.seen) return;

      const currentUserId = userRef.current?.id?.toString();
      const senderId = getSenderId(message)?.toString();
      if (!senderId || senderId === currentUserId) return;

      const seenSet = seenSentRef.current[conversationIdStr] || new Set();
      if (seenSet.has(messageId)) return;

      socket.emit(SOCKET_EVENTS.SEEN_SEND, {
        conversation_id: conversationIdStr,
        message_id: messageId,
      });
      seenSet.add(messageId);
      seenSentRef.current[conversationIdStr] = seenSet;
    },
    [socket]
  );
  
  // Cache for sender info in group chats (senderId -> {username, profile_pic})
  const [senderInfoCache, setSenderInfoCache] = useState({});

  const selectedChatRef = useRef(null);
  const userRef = useRef(null);
  const activeConversationIdRef = useRef(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleAnyEvent = (eventName, payload) => {
      console.log('[socket]', eventName, payload);
    };

    const storeRecentReceive = (conversationIdStr, signature) => {
      if (!conversationIdStr || !signature) return;
      const now = Date.now();
      const list = recentReceiveRef.current[conversationIdStr] || [];
      recentReceiveRef.current[conversationIdStr] = [...list, { signature, ts: now }]
        .filter((item) => now - item.ts < 4000);
    };

    const hasRecentReceive = (conversationIdStr, signature) => {
      if (!conversationIdStr || !signature) return false;
      const now = Date.now();
      const list = recentReceiveRef.current[conversationIdStr] || [];
      const match = list.some((item) => item.signature === signature && now - item.ts < 4000);
      if (!match) {
        recentReceiveRef.current[conversationIdStr] = list.filter(
          (item) => now - item.ts < 4000
        );
      }
      return match;
    };

    const handleMessageReceive = (payload) => {
      const conversationId = payload?.conversation_id || payload?.conversationId;
      const messageText = payload?.message_text || payload?.message || '';
      const messageType = payload?.message_type || payload?.type || 'text';
      if (!conversationId) {
        return;
      }
      const conversationIdStr = conversationId?.toString();
      const messageId = payload?.message_id;
      const senderId = payload?.sender_id || payload?.sender || payload?.from_user_id || payload?.user_id;
      const when = payload?.when;
      const signature = messageId
        ? `id:${messageId}`
        : (when && senderId
          ? `alt:${senderId}|${messageText}|${when}`
          : '');
      if (hasRecentReceive(conversationIdStr, signature)) {
        return;
      }
      storeRecentReceive(conversationIdStr, signature);

      const resolvedMessageId = messageId || `receive-${Date.now()}`;
      const senderInfo = payload?.sender_info || payload?.senderInfo || null;
      const messageSender = senderInfo?._id
        || senderInfo?.id
        || payload?.sender_id
        || payload?.sender
        || payload?.from_user_id
        || payload?.user_id
        || null;
      const messageWhen = payload?.when ? new Date(payload.when).toISOString() : new Date().toISOString();

      const message = {
        _id: resolvedMessageId,
        id: resolvedMessageId,
        conversation_id: conversationId,
        sender: messageSender,
        type: payload?.message_type || payload?.type || 'text',
        content: messageText,
        attachment_key: payload?.attachment_key || '',
        file_name: payload?.file_name || '',
        mime_type: payload?.mime_type || '',
        file_size: payload?.file_size || 0,
        created_at: messageWhen,
        edited: false,
        sender_info: senderInfo || undefined,
      };

    pendingMessagesRef.current[conversationIdStr] = [
      ...(pendingMessagesRef.current[conversationIdStr] || []),
      message,
    ];
    animatedMessageIdsRef.current.add(messageId);
    setLastAnimatedMessageId(messageId);
    if (messageAnimationTimeoutRef.current) {
      clearTimeout(messageAnimationTimeoutRef.current);
    }
    messageAnimationTimeoutRef.current = setTimeout(() => {
      setLastAnimatedMessageId(null);
    }, 600);

      const selectedConversationId = getConversationId(selectedChatRef.current);
      const selectedConversationIdStr = selectedConversationId?.toString();
      // A conversation only counts as "active" (auto-read, no unread badge) when
      // its pane is actually visible — not merely selected behind a closed mobile pane.
      const isActiveConversation = Boolean(
        selectedConversationIdStr
        && selectedConversationIdStr === conversationIdStr
        && isChatViewVisibleRef.current
      );
      const existsInList = contactsRef.current.some(
        (c) => getConversationId(c)?.toString() === conversationIdStr
      );

      if (!existsInList) {
        setUnreadCount(conversationIdStr, (count) => count + 1);
        if (conversationIdStr) {
          const fallbackContactInfo = {
            _id: messageSender || undefined,
            id: messageSender || undefined,
            username: payload?.senderUsername || payload?.sender_name || 'New user',
            profile_pic: null,
            status: 'offline',
          };

          setContacts((prev) => {
            const exists = prev.some(
              (c) => getConversationId(c)?.toString() === conversationIdStr
            );
            if (exists) return prev;
            const contactInfo = senderInfo || fallbackContactInfo;
            const newChat = {
              _id: conversationIdStr,
              id: conversationIdStr,
              type: payload?.type === 'group' ? 'group' : 'pv',
              contact_info: contactInfo,
              group_name: payload?.group_name || null,
              group_avatar: payload?.group_avatar || null,
              last_message: {
                content: messageText,
                type: 'text',
                sender: contactInfo?.username || '',
                when: message.created_at,
                message_id: messageId,
                sender_id: messageSender || undefined,
              },
              unread_messages_count: 1,
            };
            return [newChat, ...prev];
          });

          if (!senderInfo && messageSender) {
            const cacheBuster = `cb=${Date.now()}`;
            fetch(`/api/v1/members/${messageSender}/info?${cacheBuster}`, {
              method: 'GET',
              credentials: 'include',
            })
              .then((response) => (response.ok ? response.json() : null))
              .then((data) => {
                const memberInfo = data?.member_info || null;
                if (!memberInfo) return;
                setContacts((prev) =>
                  prev.map((chat) => {
                    const chatId = getConversationId(chat)?.toString();
                    if (chatId !== conversationIdStr) return chat;
                    return {
                      ...chat,
                      contact_info: memberInfo,
                    };
                  })
                );
              })
              .catch(() => {});
          }
        }
        refreshContacts();
        return;
      }

      setContacts((prev) => {
        const next = [...prev];
        const idx = next.findIndex(
          (c) => getConversationId(c)?.toString() === conversationIdStr
        );
        if (idx === -1) {
          return prev;
        }

        const chat = next[idx];
        const currentUnread = chat?.unread_messages_count ?? chat?.unread_count ?? 0;
        const nextUnread = isActiveConversation ? 0 : currentUnread + 1;
        const senderUsername = senderInfo?.username
          || payload?.senderUsername
          || payload?.sender_name
          || chat?.last_message?.sender
          || '';
        next[idx] = {
          ...chat,
          last_message: {
            content: getMessagePreviewText(message),
            type: messageType,
            sender: senderUsername,
            when: message.created_at,
            message_id: messageId,
            sender_id: messageSender || undefined,
          },
          unread_messages_count: nextUnread,
        };

        const [moved] = next.splice(idx, 1);
        next.unshift(moved);
        return next;
      });

      if (isActiveConversation) {
        setMessagesConversationId(conversationIdStr);
        animatedMessageIdsRef.current.add(messageId);
        flushPendingMessages(conversationIdStr);
        if (isNearBottomRef.current) {
          shouldAutoScrollRef.current = true;
        }
        setUnreadCount(conversationIdStr, 0);
      } else {
        setUnreadCount(conversationIdStr, (count) => count + 1);
      }
    };

    const handleMessageSendAck = (payload) => {
      const messageId = payload?.message_id || payload?.messageId;
      const trackId = payload?.track_id || payload?.trackId;
      if (!messageId || !trackId) return;

      const pending = pendingSendMapRef.current[trackId];
      if (!pending?.tempId) return;
      delete pendingSendMapRef.current[trackId];
      if (pendingAckTimersRef.current[pending.tempId]) {
        clearTimeout(pendingAckTimersRef.current[pending.tempId]);
        delete pendingAckTimersRef.current[pending.tempId];
      }
      const isOptimisticAck = pending?.tempId?.toString().startsWith('optimistic-');
      mediaUploadTasksRef.current.delete(pending.tempId);
      if (!isOptimisticAck) {
        animatedMessageIdsRef.current.add(messageId);
        setLastAnimatedMessageId(messageId);
        if (messageAnimationTimeoutRef.current) {
          clearTimeout(messageAnimationTimeoutRef.current);
        }
        messageAnimationTimeoutRef.current = setTimeout(() => {
          setLastAnimatedMessageId(null);
        }, 600);
      }

      setMessages((prev) =>
        prev.map((m) => {
          const mid = getMessageId(m);
          if (mid === pending.tempId) {
            return {
              ...m,
              _id: messageId,
              id: messageId,
              client_id: m.client_id || pending.tempId,
              status: 'sent',
            };
          }
          return m;
        })
      );
      setContacts((prev) =>
        prev.map((chat) => {
          const chatId = getConversationId(chat)?.toString();
          if (chatId !== pending.conversationId) return chat;
          const lastMessageId = chat?.last_message?.message_id;
          if (lastMessageId && lastMessageId === pending.tempId) {
            return {
              ...chat,
              last_message: {
                ...chat.last_message,
                message_id: messageId,
              },
            };
          }
          return chat;
        })
      );
    };

    const resolveReplyPreview = (replyId) => {
      if (!replyId) return null;
      const replyIdStr = replyId.toString();
      const match = messagesRef.current.find(
        (m) => getMessageId(m)?.toString() === replyIdStr
      );
      if (!match) {
        return { messageId: replyIdStr };
      }
      return {
        messageId: replyIdStr,
        content: match?.content || match?.text || '',
        sender: match?.sender,
      };
    };

    const handleMessageSendReplyAck = (payload) => {
      const messageId = payload?.message_id || payload?.messageId;
      const trackId = payload?.track_id || payload?.trackId;
      if (!messageId || !trackId) return;
      const pending = pendingReplyMapRef.current[trackId];
      if (!pending?.tempId) return;
      delete pendingReplyMapRef.current[trackId];
      mediaUploadTasksRef.current.delete(pending.tempId);
      if (pendingAckTimersRef.current[pending.tempId]) {
        clearTimeout(pendingAckTimersRef.current[pending.tempId]);
        delete pendingAckTimersRef.current[pending.tempId];
      }
      setMessages((prev) =>
        prev.map((m) => {
          const mid = getMessageId(m);
          if (mid === pending.tempId) {
            return {
              ...m,
              _id: messageId,
              id: messageId,
              status: 'sent',
            };
          }
          return m;
        })
      );
      setContacts((prev) =>
        prev.map((chat) => {
          const chatId = getConversationId(chat)?.toString();
          if (chatId !== pending.conversationId) return chat;
          const lastMessageId = chat?.last_message?.message_id;
          if (lastMessageId && lastMessageId === pending.tempId) {
            return {
              ...chat,
              last_message: {
                ...chat.last_message,
                message_id: messageId,
              },
            };
          }
          return chat;
        })
      );
    };

    const handleMessageSendReplyError = (payload) => {
      const message = payload?.message || payload?.error || 'Unable to send reply.';
      const trackId = payload?.track_id || payload?.trackId;
      toast.error(message);
      if (!trackId) return;
      const pending = pendingReplyMapRef.current[trackId];
      if (!pending?.tempId) return;
      delete pendingReplyMapRef.current[trackId];
      if (pendingAckTimersRef.current[pending.tempId]) {
        clearTimeout(pendingAckTimersRef.current[pending.tempId]);
        delete pendingAckTimersRef.current[pending.tempId];
      }
      setMessages((prev) =>
        prev.map((m) =>
          getMessageId(m) === pending.tempId ? { ...m, status: 'error' } : m
        )
      );
    };

    const handleMessageReceiveReply = (payload) => {
      const conversationId = payload?.conversation_id || payload?.conversationId;
      const messageText = payload?.message_text || payload?.message || '';
      const replyToId = payload?.replied_to || payload?.reply_to;
      const messageType = payload?.message_type || payload?.type || 'text';
      if (!conversationId) {
        return;
      }
      const conversationIdStr = conversationId?.toString();
      const messageId = payload?.message_id || payload?.messageId;
      const signature = messageId ? `id:${messageId}` : '';
      if (hasRecentReceive(conversationIdStr, signature)) {
        return;
      }
      storeRecentReceive(conversationIdStr, signature);

      const senderInfo = payload?.sender_info || payload?.senderInfo || null;
      const messageSender = senderInfo?._id
        || senderInfo?.id
        || payload?.sender_id
        || payload?.sender
        || payload?.from_user_id
        || payload?.user_id
        || null;
      const messageWhen = payload?.when
        ? new Date(payload.when).toISOString()
        : new Date().toISOString();

      const replyPreview = resolveReplyPreview(replyToId);
      const resolvedMessageId = messageId || `receive-${Date.now()}`;
      const message = {
        _id: resolvedMessageId,
        id: resolvedMessageId,
        conversation_id: conversationId,
        sender: messageSender,
        type: payload?.message_type || payload?.type || 'text',
        content: messageText,
        attachment_key: payload?.attachment_key || '',
        file_name: payload?.file_name || '',
        mime_type: payload?.mime_type || '',
        file_size: payload?.file_size || 0,
        created_at: messageWhen,
        edited: false,
        reply_to: replyPreview,
        sender_info: senderInfo || undefined,
      };

      pendingMessagesRef.current[conversationIdStr] = [
        ...(pendingMessagesRef.current[conversationIdStr] || []),
        message,
      ];

      const selectedConversationId = getConversationId(selectedChatRef.current);
      const selectedConversationIdStr = selectedConversationId?.toString();
      // Same visibility rule as handleMessageReceive: selected-but-hidden
      // (mobile pane closed) does not count as active.
      const isActiveConversation = Boolean(
        selectedConversationIdStr
        && selectedConversationIdStr === conversationIdStr
        && isChatViewVisibleRef.current
      );
      const existsInList = contactsRef.current.some(
        (c) => getConversationId(c)?.toString() === conversationIdStr
      );

      if (!existsInList) {
        setUnreadCount(conversationIdStr, (count) => count + 1);
        refreshContacts();
        return;
      }

      setContacts((prev) => {
        const next = [...prev];
        const idx = next.findIndex(
          (c) => getConversationId(c)?.toString() === conversationIdStr
        );
        if (idx === -1) return prev;
        const chat = next[idx];
        const currentUnread = chat?.unread_messages_count ?? chat?.unread_count ?? 0;
        const nextUnread = isActiveConversation ? 0 : currentUnread + 1;
        const senderUsername = senderInfo?.username
          || payload?.senderUsername
          || payload?.sender_name
          || chat?.last_message?.sender
          || '';
        next[idx] = {
          ...chat,
          last_message: {
            content: getMessagePreviewText(message),
            type: messageType,
            sender: senderUsername,
            when: messageWhen,
            message_id: resolvedMessageId,
            sender_id: messageSender || undefined,
          },
          unread_messages_count: nextUnread,
        };

        const [moved] = next.splice(idx, 1);
        next.unshift(moved);
        return next;
      });

      if (isActiveConversation) {
        setMessagesConversationId(conversationIdStr);
        animatedMessageIdsRef.current.add(resolvedMessageId);
        flushPendingMessages(conversationIdStr);
        if (isNearBottomRef.current) {
          shouldAutoScrollRef.current = true;
        }
        setUnreadCount(conversationIdStr, 0);
      } else {
        setUnreadCount(conversationIdStr, (count) => count + 1);
      }
    };

    const handleMessageSendError = (payload) => {
      const trackId = payload?.track_id || payload?.trackId;
      const errorMessage = payload?.message || payload?.error || '';
      const errorConversationId = payload?.conversation_id || payload?.conversationId;
      const pendingPv = pendingPvRef.current;
      const isAlreadyExistsError = typeof errorMessage === 'string'
        && errorMessage.toLowerCase().includes('already have conversation');

      if (isAlreadyExistsError && pendingPv?.trackId) {
        const pendingTrackId = pendingPv.trackId;
        const resolvedConversationId = errorConversationId?.toString();

        const tempId = pendingPv.tempId?.toString();
        if (resolvedConversationId && tempId) {
          promotePendingConversation(tempId, resolvedConversationId);
        }

        if (pendingPv.mediaCreation && resolvedConversationId) {
          pendingPv.mediaCreation.creatorMessageHandled = false;
          pendingPv.mediaCreation.resolveConversation(resolvedConversationId);
          pendingPvRef.current = null;
          return;
        }

        if (socket && socket.connected && resolvedConversationId) {
          socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
            conversation_id: resolvedConversationId,
            message_text: pendingPv.messageText,
            track_id: pendingTrackId,
            message_type: pendingPv.messageType || 'text',
            attachment_key: pendingPv.attachmentKey || '',
            replied_to: pendingPv.repliedTo || null,
          });
        }

        pendingPvRef.current = null;
        return;
      }

      if (pendingPv?.mediaCreation && !trackId) {
        pendingPv.mediaCreation.rejectConversation(
          new Error(errorMessage || 'Unable to create conversation.')
        );
        pendingPvRef.current = null;
        return;
      }

      if (pendingPv?.trackId && !trackId) {
        const pendingTrackId = pendingPv.trackId;
        const pending = pendingSendMapRef.current[pendingTrackId]
          || pendingReplyMapRef.current[pendingTrackId];
        delete pendingSendMapRef.current[pendingTrackId];
        delete pendingReplyMapRef.current[pendingTrackId];
        if (pendingAckTimersRef.current[pendingTrackId]) {
          clearTimeout(pendingAckTimersRef.current[pendingTrackId]);
          delete pendingAckTimersRef.current[pendingTrackId];
        }
        if (pending?.tempId) {
          setMessages((currentMessages) => currentMessages.map((message) => (
            getMessageId(message) === pending.tempId
              ? { ...message, status: 'error' }
              : message
          )));
        }
        pendingPvRef.current = null;
        toast.error(errorMessage || 'Unable to create conversation.');
        return;
      }

      if (!trackId) return;
      const pending = pendingSendMapRef.current[trackId];
      if (!pending?.tempId) return;
      delete pendingSendMapRef.current[trackId];
      if (pendingAckTimersRef.current[pending.tempId]) {
        clearTimeout(pendingAckTimersRef.current[pending.tempId]);
        delete pendingAckTimersRef.current[pending.tempId];
      }
      setMessages((prev) =>
        prev.map((m) =>
          getMessageId(m) === pending.tempId ? { ...m, status: 'error' } : m
        )
      );
    };

    const handleMessageSeen = (payload) => {
      const conversationId = payload?.conversation_id || payload?.conversationId;
      const messageId = payload?.message_id || payload?.messageId;
      if (!conversationId || !messageId) return;

      const activeConversationId = activeConversationIdRef.current?.toString();
      const isActiveConversation = activeConversationId === conversationId.toString();

      let seenMessage = null;
      if (isActiveConversation) {
        setMessages((prev) =>
          prev.map((m) => {
            if (getMessageId(m) === messageId) {
              seenMessage = m;
              return { ...m, seen: true };
            }
            return m;
          })
        );
      }
      const conversationIdStr = conversationId.toString();
      setContacts((prev) =>
        prev.map((chat) => {
          const chatId = getConversationId(chat)?.toString();
          if (chatId !== conversationIdStr) return chat;
          const last = chat?.last_message;
          if (!last) return chat;
          const lastId = (last.message_id || last._id || last.id)?.toString();
          const seenId = messageId.toString();
          const lastText = last?.content || last?.text || '';
          const seenText = seenMessage?.content || seenMessage?.text || '';
          const lastTime = new Date(last?.when || last?.created_at || 0).getTime();
          const seenTime = new Date(seenMessage?.created_at || seenMessage?.when || 0).getTime();
          const matchesId = lastId && lastId === seenId;
          const matchesFallback = !matchesId
            && lastText
            && seenText
            && lastText === seenText
            && (!lastTime || !seenTime || Math.abs(lastTime - seenTime) < 60000);
          const isMineLast = last?.sender && last.sender === userRef.current?.username;
          const shouldMarkSeen = matchesId || matchesFallback || (!lastId && isMineLast);
          if (!shouldMarkSeen) return chat;
          return {
            ...chat,
            last_message: {
              ...last,
              seen: true,
              message_id: lastId || seenId,
            },
          };
        })
      );
      const seenSet = seenSentRef.current[conversationIdStr] || new Set();
      seenSet.add(messageId);
      seenSentRef.current[conversationIdStr] = seenSet;
    };

    const handleMessageNew = (payload) => {
      const message = payload?.message;
      const conversationId = payload?.conversationId || payload?.conversation_id || message?.conversation_id;
      const messageId = getMessageId(message);
      if (!message || !conversationId || !messageId) {
        return;
      }
      const conversationIdStr = conversationId?.toString();
      const messageText = message?.content || message?.text || '';
      const signature = messageId ? `id:${messageId}` : '';
      if (hasRecentReceive(conversationIdStr, signature)) {
        return;
      }
      storeRecentReceive(conversationIdStr, signature);

      setContacts((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => getConversationId(c) === conversationId);
        if (idx === -1) return prev;

        const chat = next[idx];
        const existingLast = chat?.last_message;
        const existingText = existingLast?.content || existingLast?.text || '';
        const incomingText = getMessagePreviewText(message);
        const existingTime = new Date(existingLast?.when || existingLast?.created_at || 0).getTime();
        const incomingTime = new Date(message?.created_at || message?.when || 0).getTime();
        const shouldPreserveWhen = existingText
          && incomingText
          && existingText === incomingText
          && existingTime
          && incomingTime
          && existingTime > incomingTime;
        const resolvedWhen = shouldPreserveWhen
          ? existingLast?.when
          : (message?.created_at || new Date().toISOString());

        next[idx] = {
          ...chat,
          last_message: {
            content: incomingText,
            type: message?.type ?? 'text',
            sender: message?.sender_info?.username
              || payload?.senderUsername
              || payload?.sender_name
              || message?.sender_name
              || chat?.last_message?.sender
              || '',
            when: resolvedWhen,
            message_id: messageId,
            sender_id: getSenderId(message),
          },
        };

        const [moved] = next.splice(idx, 1);
        next.unshift(moved);
        return next;
      });

      const activeConversationId = activeConversationIdRef.current;
      if (activeConversationId && activeConversationId.toString() === conversationIdStr) {
        const incomingSenderId = getSenderId(message)?.toString();
        const currentUserId = userRef.current?.id?.toString();
        const isFromMe = currentUserId && incomingSenderId && currentUserId === incomingSenderId;
        const incomingTime = new Date(message?.created_at || message?.when || 0).getTime();
        let matchedTempId = null;
        let wasExisting = false;
        setMessages((prev) => {
          const exists = prev.some((m) => getMessageId(m) === messageId);
          if (exists) {
            wasExisting = true;
            return prev;
          }

          let replaced = false;
          const replacedList = prev.map((m) => {
            const mid = getMessageId(m)?.toString() || '';
            const content = m?.content || m?.text || '';
            const mTime = new Date(m?.created_at || m?.when || 0).getTime();
            const sameConv = m?.conversation_id?.toString() === conversationIdStr;
            if (!replaced && isFromMe && sameConv && content === messageText) {
              const isOptimistic = mid.startsWith('optimistic-') || m?.status === 'pending';
              const closeInTime = !incomingTime || !mTime || Math.abs(incomingTime - mTime) <= 60000;
              if (isOptimistic && closeInTime) {
                matchedTempId = mid;
                replaced = true;
                return {
                  ...message,
                  client_id: mid,
              local_preview: m.local_preview || message.local_preview,
              file_name: message.file_name || m.file_name,
              mime_type: message.mime_type || m.mime_type,
              file_size: message.file_size || m.file_size,
                };
              }
            }

            if (!mid.startsWith('receive-')) return m;
            const senderId = getSenderId(m)?.toString();
            if (!senderId || senderId !== incomingSenderId) return m;
            if (content !== messageText) return m;
            if (incomingTime && mTime && Math.abs(incomingTime - mTime) > 60000) return m;
            replaced = true;
            return message;
          });

          return replaced ? replacedList : [...replacedList, message];
        });
        if (matchedTempId) {
          if (pendingSendMapRef.current[matchedTempId]) {
            delete pendingSendMapRef.current[matchedTempId];
          }
          mediaUploadTasksRef.current.delete(matchedTempId);
          if (pendingAckTimersRef.current[matchedTempId]) {
            clearTimeout(pendingAckTimersRef.current[matchedTempId]);
            delete pendingAckTimersRef.current[matchedTempId];
          }
        }
        if (matchedTempId || wasExisting) {
          // Skip re-animating when we already rendered this message.
        } else {
          animatedMessageIdsRef.current.add(messageId);
          setLastAnimatedMessageId(messageId);
          if (messageAnimationTimeoutRef.current) {
            clearTimeout(messageAnimationTimeoutRef.current);
          }
          messageAnimationTimeoutRef.current = setTimeout(() => {
            setLastAnimatedMessageId(null);
          }, 600);
        }
        const pending = pendingMessagesRef.current[conversationIdStr] || [];
        if (pending.length > 0) {
          pendingMessagesRef.current[conversationIdStr] = pending.filter((m) => {
            const senderId = getSenderId(m)?.toString();
            const content = m?.content || m?.text || '';
            if (!senderId || senderId !== getSenderId(message)?.toString()) return true;
            if (content !== messageText) return true;
            const mTime = new Date(m?.created_at || m?.when || 0).getTime();
            const messageTime = new Date(message?.created_at || message?.when || 0).getTime();
            if (messageTime && mTime && Math.abs(messageTime - mTime) > 60000) return true;
            return false;
          });
        }
        if (isNearBottomRef.current) {
          shouldAutoScrollRef.current = true;
        }
      } else {
        const conversationIdStr = conversationId?.toString();
        setUnreadCount(conversationIdStr, (count) => count + 1);
      }
    };

    const handleMessageEdited = (payload) => {
      const messageId = payload?.message_id || payload?.messageId;
      const newMessage = payload?.new_message || payload?.message?.content;
      const conversationId = payload?.conversation_id || payload?.conversationId;
      if (!messageId || typeof newMessage !== 'string') {
        return;
      }

      const conversationIdStr = conversationId?.toString();
      const messageIdStr = messageId.toString();
      const activeConversationIdStr = activeConversationIdRef.current?.toString();
      const isActiveConversation = conversationIdStr
        && activeConversationIdStr === conversationIdStr;
      const lastActiveMessage = messagesRef.current[messagesRef.current.length - 1];
      const isLastActiveMessage = isActiveConversation
        && lastActiveMessage
        && getMessageId(lastActiveMessage)?.toString() === messageIdStr;
      if (
        !conversationIdStr
        || isActiveConversation
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            getMessageId(m) === messageId
              ? { ...m, content: newMessage, edited: true }
              : m
          )
        );
      }

      if (conversationIdStr) {
        setContacts((prev) =>
          prev.map((chat) => {
            const chatId = getConversationId(chat)?.toString();
            if (chatId !== conversationIdStr) {
              return chat;
            }
            const last = chat?.last_message;
            const lastId = (last?.message_id || last?._id || last?.id)?.toString();
            const shouldUpdateLast = last && (
              lastId === messageIdStr || isLastActiveMessage
            );
            if (!shouldUpdateLast) {
              return chat;
            }
            return {
              ...chat,
              last_message: {
                ...last,
                content: newMessage,
              },
            };
          })
        );
      }
    };

    const handleMessageEditAck = () => {
      pendingEditRef.current = null;
    };

    const handleMessageEditError = (payload) => {
      const message = payload?.message || payload?.error || 'Unable to edit message.';
      const messageId = payload?.message_id || payload?.messageId;
      toast.error(message);
      const pending = pendingEditRef.current;
      const targetId = messageId || pending?.messageId;
      if (targetId) {
        const previousContent = pending?.messageId === targetId
          ? pending?.previousContent
          : null;
        setMessages((prev) =>
          prev.map((m) =>
            getMessageId(m) === targetId
              ? { ...m, content: previousContent ?? m.content, edited: false }
              : m
          )
        );
      }
      pendingEditRef.current = null;
    };

    const handleMessageDeleted = (payload) => {
      const conversationId = payload?.conversationId || payload?.conversation_id;
      const messageId = payload?.message_id || payload?.messageId;
      const isLastMessage = payload?.is_last_message ?? payload?.isLastMessage;
      if (!conversationId || !messageId) return;
      const conversationIdStr = conversationId.toString();
      const isActive = activeConversationIdRef.current === conversationIdStr;
      const deletedIdStr = messageId.toString();
      const stripReplyIfDeleted = (msg) => {
        const reply = msg?.reply_to || msg?.replyTo || msg?.reply_to_message;
        const replyId = reply?.messageId
          || reply?.message_id
          || reply?._id
          || reply?.id;
        if (!replyId || replyId.toString() !== deletedIdStr) return msg;
        return { ...msg, reply_to: null };
      };
      setMessages((prev) =>
        prev
          .filter((m) => getMessageId(m) !== messageId)
          .map(stripReplyIfDeleted)
      );
      if (pendingMessagesRef.current[conversationIdStr]) {
        pendingMessagesRef.current[conversationIdStr] = pendingMessagesRef.current[
          conversationIdStr
        ]
          .filter((m) => getMessageId(m) !== messageId)
          .map(stripReplyIfDeleted);
      }

      if (!isActive && (unreadCountsRef.current[conversationIdStr] || 0) > 0) {
        setUnreadCount(conversationIdStr, (count) => Math.max(0, count - 1));
        setContacts((prev) =>
          prev.map((chat) => {
            const chatId = getConversationId(chat)?.toString();
            if (chatId !== conversationIdStr) return chat;
            const currentUnread = chat?.unread_messages_count ?? chat?.unread_count ?? 0;
            if (!currentUnread) return chat;
            return {
              ...chat,
              unread_messages_count: Math.max(0, currentUnread - 1),
            };
          })
        );
      }

      if (isLastMessage) {
        refreshContacts();
      }
    };

    const handleMessageDeleteAck = (payload) => {
      const messageId = payload?.message_id || payload?.messageId;
      if (!messageId) {
        return;
      }
      const deletedIdStr = messageId.toString();
      const stripReplyIfDeleted = (msg) => {
        const reply = msg?.reply_to || msg?.replyTo || msg?.reply_to_message;
        const replyId = reply?.messageId
          || reply?.message_id
          || reply?._id
          || reply?.id;
        if (!replyId || replyId.toString() !== deletedIdStr) return msg;
        return { ...msg, reply_to: null };
      };
      setMessages((prev) => prev.map(stripReplyIfDeleted));
      Object.keys(pendingMessagesRef.current || {}).forEach((convId) => {
        pendingMessagesRef.current[convId] = (pendingMessagesRef.current[convId] || [])
          .map(stripReplyIfDeleted);
      });
      const pending = pendingDeleteRef.current.get(messageId.toString());
      const conversationIdStr = pending?.conversationId
        || payload?.conversation_id?.toString()
        || payload?.conversationId?.toString();
      if (conversationIdStr) {
        const lastIsDeleted = contactsRef.current.some((chat) => {
          const chatId = getConversationId(chat)?.toString();
          if (chatId !== conversationIdStr) return false;
          const lastId = (chat.last_message?.message_id || chat.last_message?._id || chat.last_message?.id)?.toString();
          return lastId === messageId.toString();
        });
        if (lastIsDeleted || pending?.wasLast) {
          const activeConversationIdStr = activeConversationIdRef.current?.toString();
          if (activeConversationIdStr && activeConversationIdStr === conversationIdStr) {
            const lastMessage = pending?.nextLastMessage
              || messagesRef.current[messagesRef.current.length - 1];
            setContacts((prev) =>
              prev.map((chat) => {
                const chatId = getConversationId(chat)?.toString();
                if (chatId !== conversationIdStr) return chat;
                if (!lastMessage) {
                  return {
                    ...chat,
                    last_message: {
                      content: '',
                      type: 'text',
                      sender: chat?.last_message?.sender || '',
                      when: '',
                      message_id: null,
                    },
                  };
                }
                return {
                  ...chat,
                  last_message: {
                    content: lastMessage?.content || lastMessage?.text || '',
                    type: lastMessage?.type || 'text',
                    sender: lastMessage?.sender_username || lastMessage?.sender_name || lastMessage?.sender || chat?.last_message?.sender || '',
                    when: lastMessage?.created_at || lastMessage?.when || '',
                    message_id: getMessageId(lastMessage),
                    sender_id: lastMessage?.sender || lastMessage?.sender_id || lastMessage?.from_user_id,
                  },
                };
              })
            );
          } else {
            refreshContacts();
          }
        }
      }
      pendingDeleteRef.current.delete(messageId.toString());
    };

    const handleMessageDeleteError = (payload) => {
      const messageId = payload?.message_id || payload?.messageId;
      const errorMessage = payload?.message || payload?.error || 'Unable to delete message.';
      toast.error(errorMessage);
      if (!messageId) return;
      const pending = pendingDeleteRef.current.get(messageId.toString());
      if (pending?.message) {
        setMessages((prev) => {
          const next = [...prev];
          const insertIndex = Math.min(pending.index, next.length);
          next.splice(insertIndex, 0, pending.message);
          return next;
        });
        if (pending?.wasLast && pending?.conversationId) {
          setContacts((prev) =>
            prev.map((chat) => {
              const chatId = getConversationId(chat)?.toString();
              if (chatId !== pending.conversationId) return chat;
              if (!pending.previousLastMessage) return chat;
              return {
                ...chat,
                last_message: pending.previousLastMessage,
              };
            })
          );
        }
        pendingDeleteRef.current.delete(messageId.toString());
      }
    };

    const handleConversationDeleted = (payload) => {
      const conversationId = payload?.conversationId || payload?.conversation_id;
      if (!conversationId) return;

      setContacts((prev) => prev.filter((c) => getConversationId(c) !== conversationId));
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });

      if (activeConversationIdRef.current?.toString() === conversationId.toString()) {
        setSelectedChat(null);
        setMessages([]);
        setIsMobileChatOpen(false);
        navigate('/chats', { replace: true });
      }
    };

    const handleConversationDeleteAck = (payload) => {
      const conversationId = payload?.conversation_id || payload?.conversationId;
      const message = payload?.message;
      if (!conversationId) {
        setIsDeletingConversation(false);
        return;
      }
      if (deleteConversationTimeoutRef.current) {
        clearTimeout(deleteConversationTimeoutRef.current);
        deleteConversationTimeoutRef.current = null;
      }
      handleConversationDeleted({ conversation_id: conversationId });
      toast.success(message || 'Conversation deleted.');
      setDeleteConfirm({ open: false, conversationId: null });
      setIsDeletingConversation(false);
    };

    const handleConversationDeleteError = (payload) => {
      const message = payload?.message || payload?.error || 'Unable to delete conversation.';
      toast.error(message);
      if (deleteConversationTimeoutRef.current) {
        clearTimeout(deleteConversationTimeoutRef.current);
        deleteConversationTimeoutRef.current = null;
      }
      setIsDeletingConversation(false);
    };

    const handleGenericMessage = (payload) => {
      const messageText = payload?.message;
      const newConversationId = payload?.conversationId || payload?.conversation_id;
      const pending = pendingPvRef.current;
      if (messageText !== 'Conversation created' || !newConversationId || !pending?.tempId) {
        return;
      }

      const tempId = pending.tempId;
      promotePendingConversation(tempId, newConversationId);
      if (pending.mediaCreation) {
        pending.mediaCreation.creatorMessageHandled = true;
        pending.mediaCreation.resolveConversation(newConversationId.toString());
      }
      pendingPvRef.current = null;
    };

    const handleNewPvConversation = (payload) => {
      const conversationId = payload?.conversation_id || payload?.conversationId;
      if (!conversationId) {
        return;
      }
      refreshContacts();
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, handleMessageReceive);
    socket.on(SOCKET_EVENTS.MESSAGE_SEND_ACK, handleMessageSendAck);
    socket.on(SOCKET_EVENTS.MESSAGE_SEND_REPLY_ACK, handleMessageSendReplyAck);
    socket.on(SOCKET_EVENTS.MESSAGE_SEND_REPLY_ERROR, handleMessageSendReplyError);
    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
    socket.on('message:edit:ack', handleMessageEditAck);
    socket.on('message:edit:error', handleMessageEditError);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE_REPLY, handleMessageReceiveReply);
    socket.on('message:delete:ack', handleMessageDeleteAck);
    socket.on('message:delete:error', handleMessageDeleteError);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETE_FOR_ME_ACK, handleMessageDeleteAck);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETE_FOR_ME_ERROR, handleMessageDeleteError);
    socket.on(SOCKET_EVENTS.CONVERSATION_PV_DELETED, handleConversationDeleted);
    socket.on(SOCKET_EVENTS.CONVERSATION_PV_DELETE_ACK, handleConversationDeleteAck);
    socket.on(SOCKET_EVENTS.CONVERSATION_PV_DELETE_ERROR, handleConversationDeleteError);
    socket.on('message', handleGenericMessage);
    socket.on('error', handleMessageSendError);
    const handleStatusOnline = (payload) => {
      const userId = payload?.user_id;
      if (!userId) return;
      const timer = statusOfflineTimersRef.current[userId];
      if (timer) {
        clearTimeout(timer);
        delete statusOfflineTimersRef.current[userId];
      }
      updateContactStatus(userId, 'online');
    };
    const handleStatusOffline = (payload) => {
      const userId = payload?.user_id;
      if (!userId) return;
      const existing = statusOfflineTimersRef.current[userId];
      if (existing) {
        clearTimeout(existing);
      }
      statusOfflineTimersRef.current[userId] = setTimeout(() => {
        updateContactStatus(userId, 'offline');
        delete statusOfflineTimersRef.current[userId];
      }, 5000);
    };
    socket.on('status:online', handleStatusOnline);
    socket.on('status:offline', handleStatusOffline);
    socket.on(SOCKET_EVENTS.NEW_PV_CONVERSATION, handleNewPvConversation);
    socket.onAny(handleAnyEvent);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
      socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE, handleMessageReceive);
    socket.off(SOCKET_EVENTS.MESSAGE_SEND_ACK, handleMessageSendAck);
    socket.off(SOCKET_EVENTS.MESSAGE_SEND_REPLY_ACK, handleMessageSendReplyAck);
    socket.off(SOCKET_EVENTS.MESSAGE_SEND_REPLY_ERROR, handleMessageSendReplyError);
      socket.off(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
      socket.off('message:edit:ack', handleMessageEditAck);
      socket.off('message:edit:error', handleMessageEditError);
    socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE_REPLY, handleMessageReceiveReply);
      socket.off('message:delete:ack', handleMessageDeleteAck);
      socket.off('message:delete:error', handleMessageDeleteError);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETE_FOR_ME_ACK, handleMessageDeleteAck);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETE_FOR_ME_ERROR, handleMessageDeleteError);
      socket.off(SOCKET_EVENTS.CONVERSATION_PV_DELETED, handleConversationDeleted);
      socket.off(SOCKET_EVENTS.CONVERSATION_PV_DELETE_ACK, handleConversationDeleteAck);
      socket.off(SOCKET_EVENTS.CONVERSATION_PV_DELETE_ERROR, handleConversationDeleteError);
      socket.off('message', handleGenericMessage);
      socket.off('error', handleMessageSendError);
      socket.off('status:online', handleStatusOnline);
      socket.off('status:offline', handleStatusOffline);
      socket.off(SOCKET_EVENTS.NEW_PV_CONVERSATION, handleNewPvConversation);
      socket.offAny(handleAnyEvent);
      refreshTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      refreshTimeoutsRef.current = [];
      Object.values(statusOfflineTimersRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
      statusOfflineTimersRef.current = {};
      Object.values(pendingAckTimersRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
      pendingAckTimersRef.current = {};
      if (messageAnimationTimeoutRef.current) {
        clearTimeout(messageAnimationTimeoutRef.current);
      }
      if (deleteConversationTimeoutRef.current) {
        clearTimeout(deleteConversationTimeoutRef.current);
        deleteConversationTimeoutRef.current = null;
      }
    };
  }, [
    emitSeenForMessage,
    navigate,
    promotePendingConversation,
    refreshContacts,
    setConversationAlias,
    setUnreadCount,
    socket,
    updateContactStatus,
  ]);

  useEffect(() => {
    const nextConversationIdStr = selectedChatIdStr;
    const prevConversationIdStr = activeConversationIdRef.current;

    if (socket && socket.connected && prevConversationIdStr && prevConversationIdStr !== nextConversationIdStr) {
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId: prevConversationIdStr });
    }

    activeConversationIdRef.current = nextConversationIdStr;

    if (!socket || !socket.connected || !nextConversationIdStr) {
      return;
    }

    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: nextConversationIdStr });
    setUnreadCount(nextConversationIdStr, 0);
    setContacts((prev) =>
      prev.map((chat) => {
        const chatId = getConversationId(chat)?.toString();
        if (chatId !== nextConversationIdStr) return chat;
        return {
          ...chat,
          unread_messages_count: 0,
          unread_count: 0,
        };
      })
    );

    const contactId = selectedChatRef.current?.type === 'pv'
      ? (selectedChatRef.current?.contact_info?._id || selectedChatRef.current?.contact_info?.id)
      : null;
    if (contactId) {
      fetchContactStatus(contactId);
    }

  }, [selectedChatIdStr, setUnreadCount, socket, socketStatus, fetchContactStatus]);

  useEffect(() => {
    const routeId = routeConversationId?.toString();
    if (!routeId) {
      if (selectedChatRef.current) {
        setSelectedChat(null);
        setIsMobileChatOpen(false);
      }
      return;
    }

    const matchingChat = contacts.find(
      (chat) => getConversationId(chat)?.toString() === routeId
    );
    if (matchingChat) {
      if (selectedChatRef.current !== matchingChat) {
        setSelectedChat(matchingChat);
      }
      setIsMobileChatOpen(true);
      return;
    }

    if (hasLoadedContacts) {
      navigate('/chats', { replace: true });
    }
  }, [contacts, hasLoadedContacts, navigate, routeConversationId]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.button === 2) {
        return;
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setIsChatMenuOpen(false);
      }
      if (messageContextMenu && event.target?.closest && event.target.closest('[data-message-context-menu]') === null) {
        setMessageContextMenu(null);
      }
      if (conversationContextMenu && event.target?.closest && event.target.closest('[data-conversation-context-menu]') === null) {
        setConversationContextMenu(null);
      }
    };

    if (isChatMenuOpen || messageContextMenu || conversationContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isChatMenuOpen, messageContextMenu, conversationContextMenu]);

  useLayoutEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    // Ensure DOM is painted with the new message before scrolling.
    requestAnimationFrame(() => {
      scrollToBottom();
    });

    shouldAutoScrollRef.current = false;
  }, [messages.length, scrollToBottom, selectedChat]);

  useLayoutEffect(() => {
    if (!messageContextMenu || !messageContextMenuRef.current) {
      return;
    }

    const menuEl = messageContextMenuRef.current;
    const { innerWidth, innerHeight } = window;
    const margin = 8;
    const menuWidth = menuEl.offsetWidth || 0;
    const menuHeight = menuEl.offsetHeight || 0;
    const nextX = Math.min(
      Math.max(messageContextMenu.x, margin),
      Math.max(margin, innerWidth - menuWidth - margin)
    );
    const nextY = Math.min(
      Math.max(messageContextMenu.y, margin),
      Math.max(margin, innerHeight - menuHeight - margin)
    );

    if (nextX !== messageContextMenu.x || nextY !== messageContextMenu.y) {
      setMessageContextMenu((prev) =>
        prev ? { ...prev, x: nextX, y: nextY } : prev
      );
    }
  }, [messageContextMenu]);

  useEffect(() => {
    if (animatedMessageIdsRef.current.size === 0) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      animatedMessageIdsRef.current.clear();
    }, 260);

    return () => {
      clearTimeout(timeout);
    };
  }, [messages.length]);

  // Fetch contacts on mount
  useEffect(() => {
    if (import.meta.env.DEV && hasFetchedContactsRef.current) {
      return undefined;
    }

    hasFetchedContactsRef.current = true;
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/v1/user/conversations', {
          method: "GET",
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          const serverChats = data.conversations || [];
          setContacts((prev) => {
            const serverIds = new Set(
              serverChats.map((chat) => getConversationId(chat)?.toString()).filter(Boolean)
            );
            const tempChats = prev.filter((chat) => {
              const id = getConversationId(chat)?.toString();
              if (!id) return false;
              const isTemp = id.startsWith('temp-');
              const missingOnServer = !serverIds.has(id);
              const isEmpty = !chat.last_message?.content;
              return (isTemp || missingOnServer) && isEmpty;
            });
            const tempContactIds = new Set(
              tempChats
                .map((chat) => (chat.contact_info?._id || chat.contact_info?.id)?.toString())
                .filter(Boolean)
            );
            const filteredServerChats = tempContactIds.size === 0
              ? serverChats
              : serverChats.filter((chat) => {
                  if (chat.type !== 'pv') return true;
                  const contactId = (chat.contact_info?._id || chat.contact_info?.id)?.toString();
                  return !contactId || !tempContactIds.has(contactId);
                });
            const mergedServerChats = filteredServerChats.map((chat) => {
              const id = getConversationId(chat)?.toString();
              const existing = id
                ? prev.find((c) => getConversationId(c)?.toString() === id)
                : null;
              const existingByContact = !existing && chat.type === 'pv'
                ? prev.find((c) => {
                    if (c.type !== 'pv') return false;
                    const contactId = (c.contact_info?._id || c.contact_info?.id)?.toString();
                    const serverContactId = (chat.contact_info?._id || chat.contact_info?.id)?.toString();
                    return contactId && serverContactId && contactId === serverContactId;
                  })
                : null;
              const mergedExisting = existing || existingByContact;
              const serverLast = chat?.last_message;
              const existingLast = mergedExisting?.last_message;
              const serverHasLast = Boolean(
                serverLast?.content || serverLast?.text || serverLast?.when || serverLast?.message_id || serverLast?._id || serverLast?.id
              );
              const existingHasLast = Boolean(
                existingLast?.content || existingLast?.text || existingLast?.when || existingLast?.message_id || existingLast?._id || existingLast?.id
              );
              const serverText = serverLast?.content || serverLast?.text || '';
              const existingText = existingLast?.content || existingLast?.text || '';
              const serverTime = new Date(serverLast?.when || serverLast?.created_at || 0).getTime();
              const existingTime = new Date(existingLast?.when || existingLast?.created_at || 0).getTime();
              const keepExistingWhen = serverHasLast
                && existingHasLast
                && serverText
                && existingText
                && serverText === existingText
                && existingTime
                && serverTime
                && existingTime > serverTime;
              const mergedLast = keepExistingWhen
                ? {
                    ...serverLast,
                    ...existingLast,
                    when: existingLast?.when || serverLast?.when,
                    message_id: serverLast?.message_id || serverLast?._id || serverLast?.id || existingLast?.message_id,
                  }
                : serverLast;
              return {
                ...(serverHasLast || !existingHasLast
                  ? { ...chat, last_message: mergedLast }
                  : { ...chat, last_message: existingLast }),
                client_id: mergedExisting?.client_id || chat.client_id,
              };
            });
            return [...tempChats, ...mergedServerChats];
          });
          setHasLoadedContacts(true);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setHasLoadedContacts(true);
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    const handleNewPvEvent = () => {
      refreshContacts();
    };

    window.addEventListener('new_pv_conversation', handleNewPvEvent);

    try {
      const pending = localStorage.getItem('new_pv_conversation_pending');
      if (pending) {
        handleNewPvEvent();
        localStorage.removeItem('new_pv_conversation_pending');
      }
    } catch (error) {
      console.error('Failed to read new pv conversation flag:', error);
    }

    return () => {
      window.removeEventListener('new_pv_conversation', handleNewPvEvent);
    };
  }, [refreshContacts]);

  // Set random welcome icon on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * monoIcons.length);
    setRandomIcon(monoIcons[randomIndex]);
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      mediaUploadRequestsRef.current.forEach((request) => request.abort());
      mediaUploadRequestsRef.current.clear();
      mediaUploadTasksRef.current.forEach((task) => {
        if (task?.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(task.previewUrl);
        }
      });
      mediaUploadTasksRef.current.clear();
      const cancellationError = new Error('Upload canceled.');
      cancellationError.name = 'AbortError';
      pendingPvMediaCreationsRef.current.forEach((creation) => {
        creation.canceled = true;
        creation.rejectConversation(cancellationError);
      });
      pendingPvMediaCreationsRef.current.clear();
    };
  }, []);

  // Handle click outside options menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setIsOptionsMenuOpen(false);
      }
    };

    if (isOptionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOptionsMenuOpen]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === WALLPAPER_STORAGE_KEY) {
        setWallpaperId(event.newValue || 'aurora');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Handle click outside media picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mediaPickerRef.current && !mediaPickerRef.current.contains(event.target)) {
        setIsMediaPickerOpen(false);
      }
    };

    if (isMediaPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMediaPickerOpen]);

  useEffect(() => {
    if (!isMediaPickerOpen || mediaTab !== 'gifs') {
      return;
    }

    const controller = new AbortController();
    const query = gifQuery.trim();
    const endpoint = query
      ? 'https://api.giphy.com/v1/gifs/search'
      : 'https://api.giphy.com/v1/gifs/trending';
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      limit: `${GIPHY_LIMIT}`,
      rating: 'pg-13',
    });

    if (query) {
      params.set('q', query);
    }

    const timeout = setTimeout(() => {
      setIsGiphyLoading(true);
      setGiphyError('');

      fetch(`${endpoint}?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (response.status === 429) {
            throw new Error('GIPHY_LIMIT_REACHED');
          }
          if (!response.ok) {
            throw new Error('Unable to load GIFs right now.');
          }
          return response.json();
        })
        .then((payload) => {
          const items = payload?.data || [];
          const normalized = items.map((item) => ({
            id: item.id,
            name: item.title || 'gif',
            url: item.images?.original?.url
              || item.images?.fixed_height?.url
              || item.images?.fixed_height_small?.url,
            preview: item.images?.fixed_height_small_still?.url || item.images?.original_still?.url,
          }));
          setGiphyGifs(normalized.filter((gif) => gif.url));
        })
        .catch((error) => {
          if (error?.name === 'AbortError') {
            return;
          }
          if (error?.message === 'GIPHY_LIMIT_REACHED') {
            const message = 'Giphy API rate limit reached. Please try again later.';
            setGiphyError(message);
            toast.error(message);
            return;
          }
          const message = error?.message || 'Unable to load GIFs right now.';
          setGiphyError(message);
        })
        .finally(() => {
          setIsGiphyLoading(false);
        });
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [gifQuery, isMediaPickerOpen, mediaTab]);

  // Store previous scroll height for position preservation
  const previousScrollHeightRef = useRef(0);

  function flushPendingMessages(conversationId) {
    const conversationIdStr = conversationId?.toString();
    if (!conversationIdStr) return;

    const pending = pendingMessagesRef.current[conversationIdStr];
    if (!pending || pending.length === 0) return;

    pendingMessagesRef.current[conversationIdStr] = [];
    setMessages((prev) => {
      const makeSignature = (msg) => {
        const senderId = getSenderId(msg)?.toString() || '';
        const content = msg?.content || msg?.text || '';
        return `${senderId}|${content}`;
      };
      const matchesContentOnly = (msg, candidate) => {
        const content = msg?.content || msg?.text || '';
        const candidateContent = candidate?.content || candidate?.text || '';
        if (!content || !candidateContent || content !== candidateContent) return false;
        const msgTime = new Date(msg?.created_at || msg?.when || 0).getTime();
        const candidateTime = new Date(candidate?.created_at || candidate?.when || 0).getTime();
        if (!msgTime || !candidateTime) return true;
        return Math.abs(msgTime - candidateTime) < 60000;
      };
      const existingSignatures = new Set(prev.map(makeSignature));
      const existingIds = new Set(
        prev.map((msg) => getMessageId(msg)?.toString()).filter(Boolean)
      );
      const merged = [...prev];
      pending.forEach((msg) => {
        const mid = getMessageId(msg)?.toString();
        if (mid) {
          if (existingIds.has(mid)) return;
          merged.push(msg);
          existingIds.add(mid);
          return;
        }

        const signature = makeSignature(msg);
        if (existingSignatures.has(signature)) {
          const pendingTime = new Date(msg?.created_at || msg?.when || 0).getTime();
          const hasCloseMatch = prev.some((m) => {
            const mSignature = makeSignature(m);
            if (mSignature !== signature) return false;
            const mTime = new Date(m?.created_at || m?.when || 0).getTime();
            if (!pendingTime || !mTime) return true;
            return Math.abs(mTime - pendingTime) < 60000;
          });
          if (hasCloseMatch) return;
        }
        if (!getSenderId(msg)) {
          const hasContentMatch = prev.some((m) => matchesContentOnly(m, msg));
          if (hasContentMatch) return;
        }
        merged.push(msg);
        existingSignatures.add(signature);
      });
      return merged;
    });
  }

  // Fetch messages function - implements lazy loading
  // Initial load: offset=0, limit=10 → fetches last 10 messages (newest)
  // Scroll up: offset=10,20,30... → fetches next 10 older messages each time
  const fetchMessages = useCallback(async (conversationId, offset = 0, append = false) => {
    if (!conversationId || isLoadingMoreRef.current) return;
    if (conversationId.toString().startsWith('temp-')) {
      return;
    }

    setIsLoadingMessages(true);
    isLoadingMoreRef.current = true;

    // Store scroll position before loading older messages
    const container = messagesContainerRef.current;
    if (container && append) {
      previousScrollHeightRef.current = container.scrollHeight;
      previousScrollTopRef.current = container.scrollTop;
      pendingPrependRef.current = true;
    }

    try {
      const limit = MESSAGES_LIMIT;
      const url = `/api/v1/user/messages/${conversationId}?limit=${limit}&offset=${offset}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedMessages = data.messages || [];
        
        // Backend returns messages sorted newest first (created_at: -1)
        // We need to reverse them to show oldest first for display
        // Sort messages by date (created_at) - ascending order (oldest first)
        const sortMessagesByDate = (messages) => {
          return [...messages].sort((a, b) => {
            const dateA = new Date(a.created_at || a.when || a.timestamp || 0);
            const dateB = new Date(b.created_at || b.when || b.timestamp || 0);
            return dateA.getTime() - dateB.getTime();
          });
        };
        
        const sortedFetchedMessages = sortMessagesByDate(fetchedMessages);
        
        const activeConversationId = getConversationId(selectedChatRef.current);
        if (activeConversationId !== conversationId) {
          return;
        }
        const currentUserId = userRef.current?.id?.toString();
        const normalizedFetchedMessages = sortedFetchedMessages.map((message) =>
          normalizeMessage(message, selectedChatRef.current, currentUserId)
        );

        if (append) {
          // Prepend older messages to the beginning
          // Use functional update to access current messages state
          setMessages((prevMessages) => {
            const existingIds = new Set(
              prevMessages.map((msg) => (msg._id || msg.id)?.toString()).filter(Boolean)
            );
            const newMessages = normalizedFetchedMessages.filter((msg) => {
              const msgId = (msg._id || msg.id)?.toString();
              return msgId && !existingIds.has(msgId);
            });
            return [...newMessages, ...prevMessages];
          });
          flushPendingMessages(conversationId);
          if (normalizedFetchedMessages.length === 0) {
            pendingPrependRef.current = false;
            previousScrollHeightRef.current = 0;
            previousScrollTopRef.current = 0;
          }
        } else {
          // Initial load: replace messages with the last 10 messages (newest)
          // Already sorted oldest->newest
          if (sortedFetchedMessages.length === 0) {
            const currentChat = selectedChatRef.current;
            const lastMessage = currentChat?.last_message;
            if (lastMessage?.content) {
              const fallbackMessage = {
                _id: `fallback-${conversationId}`,
                id: `fallback-${conversationId}`,
                conversation_id: conversationId,
                sender: lastMessage.sender || '',
                type: lastMessage.type || 'text',
                content: lastMessage.content || '',
                created_at: lastMessage.when || new Date().toISOString(),
                edited: false,
              };
              setMessages([fallbackMessage]);
            } else {
              setMessages([]);
            }
          } else {
            setMessages(normalizedFetchedMessages);
          }
          flushPendingMessages(conversationId);
          isInitialLoadRef.current = true;
        }

        setMessagesConversationId(conversationId.toString());
        // Check if there are more messages to load
        // If we got exactly limit (10) messages, there might be more
        // If we got fewer than limit, we've reached the end (no more messages)
        setHasMoreMessages(fetchedMessages.length === limit);
        // Update offset for next fetch (increment by number of messages fetched)
        // This ensures we skip already-loaded messages on next fetch
        setMessagesOffset(offset + fetchedMessages.length);
        
        // Mark that we're no longer on initial load after first fetch
        if (append) {
          isInitialLoadRef.current = false;
        }
      } else {
        console.error('Failed to fetch messages:', response.status);
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setHasMoreMessages(false);
      pendingPrependRef.current = false;
      previousScrollHeightRef.current = 0;
      previousScrollTopRef.current = 0;
    } finally {
      setIsLoadingMessages(false);
      isLoadingMoreRef.current = false;
    }
  }, []);

  // Reopen refresh: when the conversation pane becomes visible again while a
  // conversation is already selected (mobile back-button return), messages may
  // have arrived while the pane was hidden. Re-fetch from the server so the
  // view includes them — the selectedChatIdStr effect won't fire because the
  // selection never changed.
  const wasChatViewVisibleRef = useRef(isChatViewVisible);
  useEffect(() => {
    const wasVisible = wasChatViewVisibleRef.current;
    wasChatViewVisibleRef.current = isChatViewVisible;
    if (!isChatViewVisible || wasVisible) return;

    const conversationIdStr = activeConversationIdRef.current?.toString();
    if (!conversationIdStr || conversationIdStr.startsWith('temp-')) return;

    setUnreadCount(conversationIdStr, 0);
    setContacts((prev) =>
      prev.map((chat) =>
        getConversationId(chat)?.toString() === conversationIdStr
          ? { ...chat, unread_messages_count: 0, unread_count: 0 }
          : chat
      )
    );
    isInitialLoadRef.current = true;
    fetchMessages(conversationIdStr, 0, false);
  }, [isChatViewVisible, fetchMessages, setUnreadCount]);

  const loadOlderMessages = useCallback(() => {
    if (!selectedChat || isLoadingMoreRef.current || !hasMoreMessagesRef.current) return;

    const conversationId = selectedChat?._id || selectedChat?.id;
    if (!conversationId) return;

    fetchMessages(conversationId, messagesOffsetRef.current, true);
  }, [fetchMessages, selectedChat]);

  useEffect(() => {
    const root = messagesContainerRef.current;
    const target = loadMoreSentinelRef.current;
    if (!root || !target || !selectedChatIdStr || messages.length === 0 || isInitialLoadRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreMessagesRef.current && !isLoadingMoreRef.current) {
          loadOlderMessages();
        }
      },
      {
        root,
        rootMargin: '180px 0px 0px',
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadOlderMessages, messages.length, selectedChatIdStr]);

  // Fetch messages when selectedChat changes
  useEffect(() => {
    if (!selectedChatIdStr) {
      setMessages([]);
      isJumpingToLatestRef.current = false;
      setShowJumpToLatest(false);
      setMessagesOffset(0);
      setHasMoreMessages(true);
      setMessagesConversationId(null);
      setSenderInfoCache({}); // Clear cache when chat changes
      isInitialLoadRef.current = true;
      previousSelectedChatIdRef.current = null;
      return;
    }

    const conversationId = selectedChatIdStr;
    const prevId = previousSelectedChatIdRef.current;
    const resolvedPrev = prevId
      ? (conversationAliasRef.current.get(prevId) || prevId)
      : null;
    const resolvedNext = conversationAliasRef.current.get(conversationId) || conversationId;
    const isSameConversation = resolvedPrev && resolvedNext && resolvedPrev === resolvedNext;

    if (!isSameConversation) {
      // Reset state and fetch initial messages (last 10 messages)
      setMessages([]);
      isJumpingToLatestRef.current = false;
      setShowJumpToLatest(false);
      setMessagesOffset(0);
      setHasMoreMessages(true);
      setMessagesConversationId(conversationId);
      setSenderInfoCache({}); // Clear cache
      isInitialLoadRef.current = true;
      if (!conversationId.toString().startsWith('temp-')) {
        fetchMessages(conversationId, 0, false);
      }
    } else {
      // Keep messages when temp id is replaced by real id.
      setMessagesConversationId(resolvedNext);
    }
    previousSelectedChatIdRef.current = conversationId;
  }, [selectedChatIdStr, fetchMessages]);

  // Fetch sender info for group messages
  useEffect(() => {
    const isGroupChat = selectedChat?.type === 'group';
    if (!isGroupChat || messages.length === 0) return;

    const currentUserId = user?.id?.toString() || user?.id;
    
    // Get unique sender IDs from received messages
    const uniqueSenderIds = [...new Set(
      messages
        .filter((msg) => {
          const messageSenderId = msg.sender?.toString() || msg.sender;
          return messageSenderId && messageSenderId !== currentUserId; // Only received messages
        })
        .map((msg) => msg.sender?.toString() || msg.sender)
        .filter(Boolean)
    )];

    // Fetch sender info for each unique sender that's not in cache
    // Backend endpoint /api/v1/members/<userid>/info accepts user ID directly
    uniqueSenderIds.forEach((senderId) => {
      const senderIdStr = senderId.toString();
      // Skip if already in cache
      if (senderInfoCache[senderIdStr]) {
        return;
      }

      // Fetch member info using sender ID directly
      const cacheBuster = `cb=${Date.now()}`;
      fetch(`/api/v1/members/${senderIdStr}/info?${cacheBuster}`, {
        method: 'GET',
        credentials: 'include',
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Failed to fetch member info');
        })
        .then((data) => {
          // Backend returns: { state: "success", member_info: { username, profile_pic, ... } }
          const memberInfo = data.member_info || {};
          const senderInfo = {
            username: memberInfo.username || 'Unknown',
            profile_pic: memberInfo.profile_pic || null,
          };
          
          setSenderInfoCache((prev) => ({
            ...prev,
            [senderIdStr]: senderInfo,
          }));
        })
        .catch((error) => {
          console.error('Failed to fetch member info for sender ID', senderIdStr, error);
        });
    });
  }, [messages, selectedChat, senderInfoCache, user?.id]);

  // Keep only lightweight position tracking in the scroll event. Older-page loading
  // is driven by the sentinel observer above, avoiding timer churn during momentum scroll.
  const handleScroll = useCallback((event) => {
    const container = event.currentTarget;
    if (scrollFrameRef.current) return;

    scrollFrameRef.current = requestAnimationFrame(() => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      isNearBottomRef.current = distanceFromBottom < 120;
      isAtBottomRef.current = distanceFromBottom < 6;
      if (isJumpingToLatestRef.current) {
        setShowJumpToLatest(false);
        if (distanceFromBottom < 6) {
          isJumpingToLatestRef.current = false;
        }
      } else {
        const shouldShowJumpButton = distanceFromBottom > 120;
        setShowJumpToLatest((current) => (
          current === shouldShowJumpButton ? current : shouldShowJumpButton
        ));
      }
      scrollFrameRef.current = null;
    });
  }, []);

  // Handle scroll position after messages update
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (isInitialLoadRef.current && messages.length > 0) {
      // Initial load - scroll to bottom to show newest messages
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
      return;
    }

    if (pendingPrependRef.current && previousScrollHeightRef.current > 0) {
      // Loading older messages - preserve scroll position precisely
      const newScrollHeight = container.scrollHeight;
      const scrollDifference = newScrollHeight - previousScrollHeightRef.current;
      const prevTop = previousScrollTopRef.current || 0;
      container.scrollTop = prevTop + scrollDifference;
      pendingPrependRef.current = false;
      previousScrollHeightRef.current = 0; // Reset
      previousScrollTopRef.current = 0;
    }
  }, [messages.length]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    // While the conversation pane is hidden (mobile chat list shown), don't
    // observe anything — visibility of an off-screen pane means nothing.
    if (!isChatViewVisible) return undefined;

    const conversationIdStr = activeConversationIdRef.current?.toString();
    if (!conversationIdStr) return;

    const messageById = new Map(
      messages.map((msg) => [getMessageId(msg)?.toString(), msg]).filter(([id]) => id)
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const messageId = entry.target.getAttribute('data-message-id');
          if (!messageId) return;
          const message = messageById.get(messageId);
          if (!message) return;
          emitSeenForMessage(message, conversationIdStr);
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    messageRefs.current.forEach((node, key) => {
      if (node && key) {
        node.setAttribute('data-message-id', key);
        observer.observe(node);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [emitSeenForMessage, messages, selectedChat, isChatViewVisible]);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter((chat) => {
      if (chat.type === "pv") {
        return chat.contact_info?.username?.toLowerCase().includes(query);
      }
      return chat.group_name?.toLowerCase().includes(query);
    });
  }, [searchQuery, contacts]);

  const sortedChats = useMemo(() => {
    const getTime = (chat) => {
      const when = chat?.last_message?.when;
      return when ? new Date(when).getTime() : 0;
    };
    return [...filteredChats].sort((a, b) => getTime(b) - getTime(a));
  }, [filteredChats]);

  const tabbedChats = useMemo(() => {
    const isPersonal = (chat) => chat?.type === 'pv' && chat?.contact_info;
    const isGroup = (chat) => chat?.type === 'group' || !chat?.contact_info;
    if (activeTab === 'personal') {
      return sortedChats.filter(isPersonal);
    }
    if (activeTab === 'groups') {
      return sortedChats.filter(isGroup);
    }
    return sortedChats;
  }, [activeTab, sortedChats]);

  // Fetch sender info for group messages
  const fetchSenderInfo = useCallback(async (senderId) => {
    if (!senderId) return null;
    
    const senderIdStr = senderId.toString();
    
    // Check cache first
    if (senderInfoCache[senderIdStr]) {
      return senderInfoCache[senderIdStr];
    }

    try {
      // Try to fetch user info - adjust endpoint if needed
      const response = await fetch(`/api/v1/user/info/${senderIdStr}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const senderInfo = {
          username: data.userInfo?.username || 'Unknown',
          profile_pic: data.userInfo?.profile_pic || null,
        };
        
        // Update cache
        setSenderInfoCache((prev) => ({
          ...prev,
          [senderIdStr]: senderInfo,
        }));
        
        return senderInfo;
      }
    } catch (error) {
      console.error('Failed to fetch sender info:', error);
    }

    return null;
  }, [senderInfoCache]);

  // Handle new conversation modal
  const handleNewConversation = useCallback(() => {
    setIsNewConversationModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsNewConversationModalOpen(false);
  }, []);

  // Handle user selection from new conversation modal
  // NOTE: This only updates frontend state.
  //       No request is sent to create a new conversation here.
  const handleSelectUser = useCallback(
    (selectedUser) => {
      const selectedUserId = (selectedUser._id || selectedUser.id)?.toString();
      if (!selectedUserId) return;

      // 1) If a conversation with this user already exists, just open it and close the modal
      const existingChat = contacts.find((chat) => {
        if (chat.type !== 'pv') return false;
        const contactId = (chat.contact_info?._id || chat.contact_info?.id)?.toString();
        return contactId && contactId === selectedUserId;
      });

      if (existingChat) {
        setSelectedChat(existingChat);
        setIsMobileChatOpen(true);
        setIsNewConversationModalOpen(false);
        navigate(`/chats/${encodeURIComponent(getConversationId(existingChat).toString())}`);
        return;
      }

      // 2) Otherwise, optimistically add the selected user to the contacts list
      const tempId = `temp-${Date.now()}`;

      const optimisticChat = {
        id: tempId,
        _id: tempId,
        client_id: tempId,
        type: 'pv',
        contact_info: {
          ...(selectedUser || {}),
        },
        last_message: {
          content: '',
          type: 'text',
          sender: user?.username || '',
          when: "",
        },
      };

      setContacts((prevContacts) => [optimisticChat, ...prevContacts]);
      setSelectedChat(optimisticChat);
      setIsMobileChatOpen(true);
      setIsNewConversationModalOpen(false);
      navigate(`/chats/${encodeURIComponent(tempId)}`);
    },
    [contacts, navigate, user]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startUserId = params.get('startUser');
    if (!startUserId) {
      startConversationRef.current = null;
      return;
    }
    if (startConversationRef.current === startUserId) {
      return;
    }
    startConversationRef.current = startUserId;

    const findExisting = (list) =>
      list.find((chat) => {
        if (chat.type !== 'pv') return false;
        const contactId = (chat.contact_info?._id || chat.contact_info?.id)?.toString();
        return contactId && contactId === startUserId;
      });

    const existingChat = findExisting(contacts);
    if (existingChat) {
      setSelectedChat(existingChat);
      setIsMobileChatOpen(true);
      navigate(`/chats/${encodeURIComponent(getConversationId(existingChat).toString())}`, {
        replace: true,
      });
      return;
    }

    refreshContacts().then((serverChats) => {
      const serverChat = findExisting(serverChats || []);
      if (serverChat) {
        setSelectedChat(serverChat);
        setIsMobileChatOpen(true);
        navigate(`/chats/${encodeURIComponent(getConversationId(serverChat).toString())}`, {
          replace: true,
        });
        return;
      }

      const tempId = `temp-${Date.now()}`;
      const optimisticChat = {
        id: tempId,
        _id: tempId,
        client_id: tempId,
        type: 'pv',
        contact_info: {
          id: startUserId,
          _id: startUserId,
          username: 'New user',
          profile_pic: null,
        },
        last_message: {
          content: '',
          type: 'text',
          sender: user?.username || '',
          when: '',
        },
      };

      setContacts((prev) => {
        const exists = findExisting(prev);
        if (exists) return prev;
        return [optimisticChat, ...prev];
      });
      setSelectedChat(optimisticChat);
      setIsMobileChatOpen(true);
      navigate(`/chats/${encodeURIComponent(tempId)}`, { replace: true });

      const cacheBuster = `cb=${Date.now()}`;
      fetch(`/api/v1/members/${startUserId}/info?${cacheBuster}`, {
        method: 'GET',
        credentials: 'include',
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          const memberInfo = data?.member_info;
          if (memberInfo) {
            setContacts((prev) =>
              prev.map((chat) => {
                const contactId = (chat.contact_info?._id || chat.contact_info?.id)?.toString();
                if (contactId !== startUserId) return chat;
                return {
                  ...chat,
                  contact_info: memberInfo,
                };
              })
            );
            setSelectedChat((prev) => {
              const prevContactId = (prev?.contact_info?._id || prev?.contact_info?.id)?.toString();
              if (prevContactId !== startUserId) {
                return prev;
              }
              return {
                ...prev,
                contact_info: memberInfo,
              };
            });
          }
        })
        .catch(() => undefined);
    });
  }, [contacts, location.search, navigate, refreshContacts, user?.username]);

  // Handle options menu toggle
  const handleOptionsMenuToggle = useCallback(() => {
    setIsOptionsMenuOpen((prev) => !prev);
  }, []);

  const openAttachmentPicker = useCallback((inputId) => {
    document.getElementById(inputId)?.click();
    setIsOptionsMenuOpen(false);
  }, []);

  const handleUploadMediaClick = useCallback(() => {
    openAttachmentPicker('media-upload');
  }, [openAttachmentPicker]);

  const handleUploadFileClick = useCallback(() => {
    openAttachmentPicker('file-upload');
  }, [openAttachmentPicker]);

  const handleUploadMusicClick = useCallback(() => {
    openAttachmentPicker('audio-upload');
  }, [openAttachmentPicker]);

  // Handle send location option click
  const handleSendLocationClick = useCallback(() => {
    setIsOptionsMenuOpen(false);
    // TODO: Implement location sharing functionality
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // TODO: Send location to backend when endpoint is ready
          console.log('Location:', latitude, longitude);
          // For now, you can add the location to the message input or send it directly
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please check your browser permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }, []);

  const handleCancelMediaUpload = useCallback((optimisticId) => {
    if (!optimisticId) return;

    const request = mediaUploadRequestsRef.current.get(optimisticId);
    const task = mediaUploadTasksRef.current.get(optimisticId);
    request?.abort();

    mediaUploadRequestsRef.current.delete(optimisticId);
    mediaUploadTasksRef.current.delete(optimisticId);
    delete pendingSendMapRef.current[optimisticId];
    delete pendingReplyMapRef.current[optimisticId];

    if (pendingAckTimersRef.current[optimisticId]) {
      clearTimeout(pendingAckTimersRef.current[optimisticId]);
      delete pendingAckTimersRef.current[optimisticId];
    }

    if (pendingPvRef.current?.trackId === optimisticId) {
      pendingPvRef.current = null;
    }

    setMessages((currentMessages) => currentMessages.filter(
      (message) => getMessageId(message)?.toString() !== optimisticId.toString()
    ));
    setMediaUploadProgress((currentProgress) => {
      const nextProgress = { ...currentProgress };
      delete nextProgress[optimisticId];
      return nextProgress;
    });

    if (task?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(task.previewUrl);
    }

    refreshContacts();
  }, [refreshContacts]);

  const sendMediaMessage = useCallback(
    async ({
      file,
      prepareFile,
      type,
      previewUrl,
      caption,
      replyTo: replyToOverride,
      fileName,
      mimeType,
      fileSize,
      attachmentKey: attachmentKeyOverride,
      optimisticId: optimisticIdOverride,
    }) => {
      if (!file && typeof prepareFile !== 'function' && !attachmentKeyOverride) return;

      if (!selectedChat) {
        toast.error('Please select a chat before sending media.');
        return;
      }

      const conversationId = getConversationId(selectedChat);
      if (!conversationId) {
        toast.error('Invalid conversation.');
        return;
      }

      const isPendingPv = selectedChat?.type === 'pv'
        && conversationId.toString().startsWith('temp-');
      const contactUserId = selectedChat?.contact_info?._id
        || selectedChat?.contact_info?.id;

      if (file?.size > MAX_FILE_SIZE || fileSize > MAX_FILE_SIZE) {
        toast.error('File size must be less than 20MB.');
        return;
      }

      const replyTo = replyToOverride !== undefined
        ? replyToOverride
        : replyingToMessage
        ? {
            messageId: getMessageId(replyingToMessage),
            content: replyingToMessage?.content
              || replyingToMessage?.text
              || getMessagePreviewText(replyingToMessage),
            sender: replyingToMessage?.sender,
          }
        : null;

      setReplyingToMessage(null);

      const optimisticId = optimisticIdOverride || createOptimisticId();
      const backendType = getBackendMessageType(type);
      const existingMessage = messagesRef.current.find(
        (message) => getMessageId(message)?.toString() === optimisticId.toString()
      );
      const resolvedFileName = fileName
        || file?.name
        || existingMessage?.file_name
        || `${backendType || 'media'}`;
      const resolvedMimeType = mimeType
        || file?.type
        || existingMessage?.mime_type
        || '';
      const resolvedFileSize = fileSize ?? file?.size ?? existingMessage?.file_size ?? 0;
      const optimisticMessage = {
        ...existingMessage,
        _id: optimisticId,
        id: optimisticId,
        client_id: optimisticId,
        conversation_id: existingMessage?.conversation_id || conversationId,
        sender: user?._id || user?.id,
        type: backendType,
        content: caption ?? existingMessage?.content ?? '',
        created_at: existingMessage?.created_at || new Date().toISOString(),
        edited: false,
        reply_to: replyTo,
        local_preview: previewUrl,
        file_name: resolvedFileName,
        mime_type: resolvedMimeType,
        file_size: resolvedFileSize,
        status: 'pending',
        seen: false,
      };

      // Track this message's upload progress (starts at 0)
      setMediaUploadProgress((prev) => ({ ...prev, [optimisticId]: 0 }));
      mediaUploadTasksRef.current.set(optimisticId, {
        conversationId: conversationId.toString(),
        previewUrl,
        file,
        prepareFile,
        type,
        caption: optimisticMessage.content,
        replyTo,
        fileName: resolvedFileName,
        mimeType: resolvedMimeType,
        fileSize: resolvedFileSize,
        attachmentKey: attachmentKeyOverride || '',
      });

      animatedMessageIdsRef.current.add(optimisticId);
      setMessages((prev) => {
        const existingIndex = prev.findIndex(
          (message) => getMessageId(message)?.toString() === optimisticId.toString()
        );
        if (existingIndex === -1) return [...prev, optimisticMessage];
        const next = [...prev];
        next[existingIndex] = optimisticMessage;
        return next;
      });
      shouldAutoScrollRef.current = true;
      scrollToBottom();

      const conversationIdStr = conversationId.toString();
      setContacts((prev) => {
        const next = [...prev];
        const idx = next.findIndex(
          (c) => getConversationId(c)?.toString() === conversationIdStr
        );
        if (idx === -1) return prev;
        const chat = next[idx];
        next[idx] = {
          ...chat,
          last_message: {
            content: getMessagePreviewText(optimisticMessage),
            type: backendType,
            sender: user?.username || chat?.last_message?.sender || '',
            when: optimisticMessage.created_at,
            message_id: optimisticId,
            sender_id: user?._id || user?.id,
          },
        };
        const [moved] = next.splice(idx, 1);
        next.unshift(moved);
        return next;
      });

      const updateProgress = (value) => {
        setMediaUploadProgress((prev) => ({ ...prev, [optimisticId]: value }));
      };

      let uploadCompleted = false;
      try {
        let attachmentKey = attachmentKeyOverride || '';
        if (!attachmentKey) {
          const uploadFile = file || await prepareFile?.();
          if (!uploadFile) {
            throw new Error('Unable to prepare media for upload.');
          }
          if (uploadFile.size > MAX_FILE_SIZE) {
            throw new Error('File size must be less than 20MB.');
          }
          mediaUploadTasksRef.current.set(optimisticId, {
            ...mediaUploadTasksRef.current.get(optimisticId),
            file: uploadFile,
            fileName: uploadFile.name,
            mimeType: uploadFile.type,
            fileSize: uploadFile.size,
          });
          attachmentKey = await uploadMediaFile(uploadFile, {
            onProgress: (value) => updateProgress(Math.min(value, 99)),
            onRequest: (request) => {
              mediaUploadRequestsRef.current.set(optimisticId, request);
            },
          });
          mediaUploadRequestsRef.current.delete(optimisticId);
          if (!attachmentKey) {
            throw new Error('Upload did not return a file key.');
          }
        }
        mediaUploadTasksRef.current.set(optimisticId, {
          ...mediaUploadTasksRef.current.get(optimisticId),
          attachmentKey,
        });
        setMessages((prev) => prev.map((message) => (
          getMessageId(message)?.toString() === optimisticId.toString()
            ? { ...message, attachment_key: attachmentKey }
            : message
        )));
        uploadCompleted = true;
        updateProgress(100);

        if (!socket || !socket.connected) {
          throw new Error('Not connected.');
        }

        // Register pending ack so the optimistic message gets its real id
        pendingSendMapRef.current[optimisticId] = {
          tempId: optimisticId,
          conversationId: conversationId.toString(),
        };
        if (pendingAckTimersRef.current[optimisticId]) {
          clearTimeout(pendingAckTimersRef.current[optimisticId]);
        }
        pendingAckTimersRef.current[optimisticId] = setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              getMessageId(m) === optimisticId ? { ...m, status: 'error' } : m
            )
          );
        }, 60000);

        if (isPendingPv) {
          if (!contactUserId) {
            throw new Error('Unable to start this conversation.');
          }

          const tempConversationId = conversationId.toString();
          let resolvedConversationId = conversationAliasRef.current.get(tempConversationId);
          let mediaCreation = null;

          if (!resolvedConversationId || resolvedConversationId === tempConversationId) {
            mediaCreation = pendingPvMediaCreationsRef.current.get(tempConversationId);

            if (!mediaCreation) {
              let resolveConversation;
              let rejectConversation;
              const conversationPromise = new Promise((resolve, reject) => {
                resolveConversation = resolve;
                rejectConversation = reject;
              });
              const waitForPreviousCreation = pendingPvMediaCreationQueueRef.current
                .catch(() => undefined);
              let releaseCreationTurn;
              const creationTurn = new Promise((resolve) => {
                releaseCreationTurn = resolve;
              });
              pendingPvMediaCreationQueueRef.current = waitForPreviousCreation
                .then(() => creationTurn);

                mediaCreation = {
                tempId: tempConversationId,
                contactUserId,
                creatorTrackId: optimisticId,
                creatorMessageHandled: false,
                canceled: false,
                conversationPromise,
                resolveConversation,
                rejectConversation,
                releaseCreationTurn,
              };
              pendingPvMediaCreationsRef.current.set(tempConversationId, mediaCreation);

              const queuedCreation = mediaCreation;
              const waitForConversationSlot = () => new Promise((resolve, reject) => {
                const timeoutAt = Date.now() + 60000;
                const checkSlot = () => {
                  const aliasedConversationId = conversationAliasRef.current.get(tempConversationId);
                  if (aliasedConversationId && aliasedConversationId !== tempConversationId) {
                    resolve(aliasedConversationId);
                    return;
                  }
                  if (!pendingPvRef.current) {
                    resolve(null);
                    return;
                  }
                  if (Date.now() >= timeoutAt) {
                    reject(new Error('Timed out while creating conversation.'));
                    return;
                  }
                  setTimeout(checkSlot, 50);
                };
                checkSlot();
              });
              void waitForPreviousCreation.then(waitForConversationSlot).then((existingConversationId) => {
                if (queuedCreation.canceled) {
                  return;
                }
                if (existingConversationId) {
                  queuedCreation.resolveConversation(existingConversationId);
                  return;
                }
                const aliasedConversationId = conversationAliasRef.current.get(tempConversationId);
                if (aliasedConversationId && aliasedConversationId !== tempConversationId) {
                  queuedCreation.resolveConversation(aliasedConversationId);
                  return;
                }
                if (!socket || !socket.connected) {
                  queuedCreation.rejectConversation(new Error('Not connected.'));
                  return;
                }

                pendingPvRef.current = {
                  tempId: tempConversationId,
                  contactUserId,
                  trackId: optimisticId,
                  messageText: caption || '',
                  messageType: backendType,
                  attachmentKey,
                  repliedTo: replyTo?.messageId || null,
                  mediaCreation: queuedCreation,
                };
                socket.emit(SOCKET_EVENTS.NEW_PV_CONVERSATION, {
                  new_user_id: contactUserId,
                  message_text: caption || '',
                  date: new Date().toISOString(),
                  track_id: optimisticId,
                  message_type: backendType,
                  attachment_key: attachmentKey,
                });
              }).catch(queuedCreation.rejectConversation);

              void conversationPromise.finally(() => {
                if (pendingPvMediaCreationsRef.current.get(tempConversationId) === queuedCreation) {
                  pendingPvMediaCreationsRef.current.delete(tempConversationId);
                }
                if (pendingPvRef.current?.mediaCreation === queuedCreation) {
                  pendingPvRef.current = null;
                }
                queuedCreation.releaseCreationTurn();
              }).catch(() => undefined);
            }

            resolvedConversationId = await mediaCreation.conversationPromise;
          }

          const creatorMessageWasSent = mediaCreation
            && mediaCreation.creatorTrackId === optimisticId
            && mediaCreation.creatorMessageHandled;
          if (!creatorMessageWasSent) {
            socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
              conversation_id: resolvedConversationId,
              message_text: caption || '',
              track_id: optimisticId,
              message_type: backendType,
              attachment_key: attachmentKey,
              replied_to: replyTo?.messageId || null,
            });
          }
          return;
        }

        socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
          conversation_id: conversationId,
          message_text: caption || '',
          track_id: optimisticId,
          message_type: backendType,
          attachment_key: attachmentKey,
          replied_to: replyTo?.messageId || null,
        });
      } catch (error) {
        const uploadWasCanceled = error?.name === 'AbortError';
        if (!uploadWasCanceled) {
          console.error('Failed to send media:', error);
          if (!error.mediaUploadToastShown) {
            error.mediaUploadToastShown = true;
            toast.error(error?.message || 'Unable to send media right now.');
          }
        }
        delete pendingSendMapRef.current[optimisticId];
        delete pendingReplyMapRef.current[optimisticId];
        if (pendingAckTimersRef.current[optimisticId]) {
          clearTimeout(pendingAckTimersRef.current[optimisticId]);
          delete pendingAckTimersRef.current[optimisticId];
        }
        setMessages((prev) => prev.map((message) => (
          getMessageId(message)?.toString() === optimisticId.toString()
            ? { ...message, status: 'error' }
            : message
        )));
        setMediaUploadProgress((prev) => {
          const next = { ...prev };
          delete next[optimisticId];
          return next;
        });
        if (!uploadWasCanceled) {
          refreshContacts();
        }
      } finally {
        mediaUploadRequestsRef.current.delete(optimisticId);
        if (uploadCompleted) {
          setTimeout(() => {
            setMediaUploadProgress((prev) => {
              const next = { ...prev };
              delete next[optimisticId];
              return next;
            });
          }, 450);
        }
      }
    },
    [replyingToMessage, refreshContacts, scrollToBottom, selectedChat, socket, user?.id]
  );

  sendMediaMessageRef.current = sendMediaMessage;

  const handleFileChange = useCallback((event) => {
    const files = Array.from(event.target.files || []);
    const isAudioPicker = event.target.id === 'audio-upload';
    event.target.value = '';
    if (files.length === 0) return;

    const sizeValidFiles = files.filter((file) => file.size <= MAX_FILE_SIZE);
    const oversizedCount = files.length - sizeValidFiles.length;
    const validFiles = isAudioPicker
      ? sizeValidFiles.filter(isAudioFile)
      : sizeValidFiles;
    const invalidAudioCount = isAudioPicker ? sizeValidFiles.length - validFiles.length : 0;
    const rejectedCount = oversizedCount + invalidAudioCount;
    if (invalidAudioCount > 0) {
      toast.error(`${invalidAudioCount} ${invalidAudioCount === 1 ? 'file is' : 'files are'} not audio files.`);
    }
    if (rejectedCount > 0) {
      if (oversizedCount > 0) {
        toast.error(`${oversizedCount} ${oversizedCount === 1 ? 'file is' : 'files are'} larger than 20 MB.`);
      }
    }

    const availableSlots = Math.max(0, MAX_MEDIA_BATCH - pendingMediaItems.length);
    const acceptedFiles = validFiles.slice(0, availableSlots);
    if (validFiles.length > availableSlots) {
      toast.error(`You can send up to ${MAX_MEDIA_BATCH} files at once.`);
    }

    const nextItems = acceptedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      type: getMediaTypeFromFile(file),
      previewUrl: URL.createObjectURL(file),
      caption: '',
    }));

    if (nextItems.length > 0) {
      setPendingMediaItems((currentItems) => [...currentItems, ...nextItems]);
      setSelectedPendingMediaId((currentId) => currentId || nextItems[0].id);
    }
  }, [pendingMediaItems.length]);

  const updatePendingMediaCaption = useCallback((itemId, caption) => {
    setPendingMediaItems((currentItems) => currentItems.map((item) => (
      item.id === itemId ? { ...item, caption } : item
    )));
  }, []);

  const removePendingMedia = useCallback((itemId) => {
    const removedItem = pendingMediaItems.find((item) => item.id === itemId);
    if (removedItem?.previewUrl) {
      URL.revokeObjectURL(removedItem.previewUrl);
    }
    const nextItems = pendingMediaItems.filter((item) => item.id !== itemId);
    setPendingMediaItems(nextItems);
    if (selectedPendingMediaId === itemId) {
      setSelectedPendingMediaId(nextItems[0]?.id || null);
    }
  }, [pendingMediaItems, selectedPendingMediaId]);

  const closePendingMedia = useCallback(() => {
    pendingMediaItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPendingMediaItems([]);
    setSelectedPendingMediaId(null);
  }, [pendingMediaItems]);

  const handleSendPendingMedia = useCallback(() => {
    if (pendingMediaItems.length === 0 || isDispatchingPendingMediaRef.current) return;

    isDispatchingPendingMediaRef.current = true;
    const itemsToSend = [...pendingMediaItems];
    setPendingMediaItems([]);
    setSelectedPendingMediaId(null);

    itemsToSend.forEach((item) => {
      void sendMediaMessage({
        file: item.file,
        type: item.type,
        previewUrl: item.previewUrl,
        caption: item.caption.trim(),
      });
    });

    queueMicrotask(() => {
      isDispatchingPendingMediaRef.current = false;
    });
  }, [pendingMediaItems, sendMediaMessage]);

  useEffect(() => {
    if (pendingMediaItems.length === 0) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closePendingMedia();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePendingMedia, pendingMediaItems.length]);

  const handleSendMedia = useCallback(
    (media) => {
      if (!selectedChat) {
        toast.error('Please select a chat before sending media.');
        return;
      }

      const mediaUrl = media?.url;
      if (!mediaUrl) return;

      const fileName = `${media.name || 'gif'}.gif`;
      const prepareFile = async () => {
        const response = await fetch(mediaUrl);
        if (!response.ok) {
          throw new Error('Unable to fetch GIF.');
        }

        const blob = await response.blob();
        const rawExtension = blob.type?.split('/')[1] || 'gif';
        const extension = rawExtension.includes('svg') ? 'svg' : rawExtension;
        return new File([blob], `${media.name || 'gif'}.${extension}`, {
          type: blob.type || 'image/gif',
        });
      };

      void sendMediaMessage({
        type: 'gif',
        previewUrl: mediaUrl,
        prepareFile,
        fileName,
        mimeType: 'image/gif',
      });
      setIsMediaPickerOpen(false);
    },
    [selectedChat, sendMediaMessage]
  );

  const getRecorderMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return '';
    }
    const options = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
    ];
    return options.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    if (!window.isSecureContext) {
      toast.error('Voice recording requires HTTPS or localhost.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Voice recording is not supported in this browser.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      toast.error('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mimeType = getRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const chunks = recordedChunksRef.current;
        const resolvedMimeType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: resolvedMimeType });
        recordedChunksRef.current = [];

        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }

        if (blob.size === 0) {
          return;
        }

        const file = new File(
          [blob],
          `voice-${Date.now()}.${resolvedMimeType.includes('mp4') ? 'm4a' : 'webm'}`,
          { type: blob.type || resolvedMimeType }
        );
        const previewUrl = URL.createObjectURL(blob);
        await sendMediaMessage({ file, type: 'voice', previewUrl });
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Unable to start recording:', error);
      toast.error('Unable to access your microphone.');
    }
  }, [getRecorderMimeType, isRecording, sendMediaMessage]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);



  // Scroll to bottom only on initial load or when switching chats
  useLayoutEffect(() => {
    if (!messagesEndRef.current) return;
    if (isInitialLoadRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages, selectedChat]);

  // Extra robust bottom scroll to handle layout shifts (images/fonts)
  useEffect(() => {
    if (!isInitialLoadRef.current) return;
    const run = () => scrollToBottom();
    run();
    requestAnimationFrame(run);
    const t1 = setTimeout(run, 0);
    const t2 = setTimeout(run, 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages.length, selectedChat, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, []);

  const activeMediaItems = giphyGifs;
  const selectedPendingMedia = pendingMediaItems.find(
    (item) => item.id === selectedPendingMediaId
  ) || pendingMediaItems[0] || null;

  useEffect(() => {
    if (!mediaViewer) return undefined;
    const handleViewerKeyDown = (event) => {
      if (event.key === 'Escape') setMediaViewer(null);
    };
    window.addEventListener('keydown', handleViewerKeyDown);
    return () => window.removeEventListener('keydown', handleViewerKeyDown);
  }, [mediaViewer]);

  const resolvedWallpaper = useMemo(() => {
    return wallpapers.find((wallpaper) => wallpaper.id === wallpaperId)
      || wallpapers.find((wallpaper) => wallpaper.id === 'aurora');
  }, [wallpaperId]);
  const hasWallpaper = resolvedWallpaper?.src && wallpaperId !== 'none';
  const messageSizeOption = getMessageSizeOption(messageSize);
  const chatThemeStyle = {
    '--chat-accent': resolvedWallpaper?.accent || '#3390ec',
    '--chat-accent-hover': resolvedWallpaper?.accentHover || '#2678c7',
    '--chat-bubble-start': resolvedWallpaper?.bubbleStart || '#3390ec',
    '--chat-bubble-end': resolvedWallpaper?.bubbleEnd || '#2476c5',
    '--btn-color': resolvedWallpaper?.accent || '#3390ec',
    '--btn-hover': resolvedWallpaper?.accentHover || '#2678c7',
    '--notification-badge': resolvedWallpaper?.accent || '#3390ec',
    '--icon-active-bg': resolvedWallpaper?.accent || '#3390ec',
    '--text-link': resolvedWallpaper?.accent || '#3390ec',
    '--chat-message-font-size': messageSizeOption.fontSize,
    '--chat-message-line-height': messageSizeOption.lineHeight,
    '--chat-bubble-padding-y': messageSizeOption.bubblePaddingY,
    '--chat-bubble-padding-x': messageSizeOption.bubblePaddingX,
    '--chat-bubble-gap': messageSizeOption.bubbleGap,
    '--chat-bubble-radius': messageSizeOption.bubbleRadius,
    '--chat-caption-font-size': messageSizeOption.captionFontSize,
  };
  const wallpaperStyle = hasWallpaper
    ? { backgroundImage: `url(${resolvedWallpaper.src})` }
    : undefined;

  useEffect(() => {
    if (!wallpaperId || !wallpapers.some((wallpaper) => wallpaper.id === wallpaperId)) {
      setWallpaperId('aurora');
      localStorage.setItem(WALLPAPER_STORAGE_KEY, 'aurora');
    }
  }, [wallpaperId]);

  const activeChatId = getConversationId(selectedChat);
  const activeChatIdStr = activeChatId?.toString();
  const messagesConversationIdStr = messagesConversationId?.toString();
  const resolvedActiveId = activeChatIdStr
    ? (conversationAliasRef.current.get(activeChatIdStr) || activeChatIdStr)
    : null;
  const resolvedMessagesId = messagesConversationIdStr
    ? (conversationAliasRef.current.get(messagesConversationIdStr) || messagesConversationIdStr)
    : null;
  const shouldRenderMessages = resolvedActiveId && resolvedMessagesId && resolvedActiveId === resolvedMessagesId;
  const visibleMessages = shouldRenderMessages ? messages : [];
  const isActiveGroup = selectedChat?.type === 'group';
  const missingSenderInfo = isActiveGroup
    && visibleMessages.some((msg) => {
      const senderId = getSenderId(msg);
      const senderIdStr = senderId?.toString();
      if (!senderIdStr) return false;
      const isMine = senderIdStr === user?.id?.toString();
      return !isMine && !senderInfoCache[senderIdStr];
    });
  const shouldHoldGroupMessages = isActiveGroup && missingSenderInfo;
  // Helper to format date like "28 July"
  const formatDateSeparator = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  };

  return (
    <div
      className={`${styles.chatsPageContainer} ${isMobileChatOpen ? styles.mobileChatOpen : ''}`}
      style={chatThemeStyle}
    >
      <Sidebar className={styles.sidebar} />

      <MobileMenu open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <aside className={styles.chatListSidebar}>
        <div className={styles.mobileChatHeader}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <span className={styles.mobileChatHeaderTitle}>Chats</span>
        </div>
        <div className={styles.searchContainer}>
          <Input
            type="text"
            name="text"
            id="search"
            placeholder="Search..."
            icon={faSearch}
            size="lg"
            fullWidth
            className="mb-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.chatTabs}>
          <button
            type="button"
            className={`${styles.chatTab} ${activeTab === 'all' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`${styles.chatTab} ${activeTab === 'personal' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal
          </button>
          <button
            type="button"
            className={`${styles.chatTab} ${activeTab === 'groups' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </button>
        </div>
  
        <div className={styles.chatList}>
          {contacts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Start a conversation...</p>
            </div>
          ) : (
            tabbedChats.map((chat, index) => {
              const isPrivateChat = chat.type === "pv";
              const lastMessageSenderId = chat.last_message?.sender_id
                || chat.last_message?.sender?._id
                || chat.last_message?.sender?.id;
              const hasLastMessage = Boolean(
                chat.last_message?.content
                || chat.last_message?.when
                || chat.last_message?.message_id
              );
              const isMyMessage = hasLastMessage
                && (lastMessageSenderId
                  ? lastMessageSenderId?.toString() === user?.id?.toString()
                  : chat.last_message?.sender === user?.username);
              const lastMessageSeen = isMyMessage
                ? resolveMessageSeen(chat.last_message, chat, user?.id?.toString())
                : false;
              const selectedId = getConversationId(selectedChat);
              const chatId = getConversationId(chat);
              const chatIdStr = chatId?.toString();
              const chatKey = chat.client_id || chatIdStr || chat._id || chat.id || index;
              const serverUnread = chat.unread_messages_count
                ?? chat.unread_count
                ?? 0;
              const unreadCount = Math.max(unreadCounts[chatIdStr] ?? 0, serverUnread);
              const avatarSrc = isPrivateChat 
                ? chat.contact_info?.profile_pic 
                : chat.group_avatar;
              const displayName = isPrivateChat 
                ? chat.contact_info?.username 
                : chat.group_name;
              const contactStatus = isPrivateChat ? chat.contact_info?.status : null;
              const statusClass = contactStatus === 'online'
                ? styles.statusDotOnline
                : styles.statusDotOffline;
  
              return (
                <div
                  key={chatKey}
                  className={`${styles.chatItem} ${selectedId && chatId && selectedId === chatId ? styles.active : ''}`}
                  onClick={() => {
                    if (longPressTriggeredRef.current) {
                      longPressTriggeredRef.current = false;
                      return;
                    }
                    handleSelectChat(chat);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setConversationContextMenu({
                      x: event.clientX,
                      y: event.clientY,
                      conversation: chat,
                    });
                  }}
                  onTouchStart={(event) => {
                    if (longPressTimeoutRef.current) {
                      clearTimeout(longPressTimeoutRef.current);
                    }
                    const touch = event.touches?.[0];
                    if (!touch) return;
                    longPressTimeoutRef.current = setTimeout(() => {
                      longPressTriggeredRef.current = true;
                      setConversationContextMenu({
                        x: touch.clientX,
                        y: touch.clientY,
                        conversation: chat,
                      });
                    }, 500);
                  }}
                  onTouchEnd={() => {
                    if (longPressTimeoutRef.current) {
                      clearTimeout(longPressTimeoutRef.current);
                    }
                  }}
                  onTouchCancel={() => {
                    if (longPressTimeoutRef.current) {
                      clearTimeout(longPressTimeoutRef.current);
                    }
                  }}
                >
                  <div className={`${styles.statusAvatar} ${styles.statusAvatarSmall}`}>
                    <ProfileAvatar size="md" src={avatarSrc} />
                    {isPrivateChat && (
                      <span className={`${styles.statusDot} ${statusClass}`} />
                    )}
                  </div>
                  <div className={styles.chatInfo}>
                    <div className={styles.chatInfoHeader}>
                      <h3>{displayName}</h3>
                      <p className={styles.lastMessage}>
                        {isMyMessage && (
                          <span className={styles.youText}>You: </span>
                        )}
                        {!isMyMessage && !isPrivateChat && (
                          <b>{chat.last_message.sender}: </b>
                        )}
                        {truncateMessage(getMessagePreviewText(chat.last_message))}
                      </p>
                    </div>
                    <div className={styles.chatInfoFooter}>
                      <span className={styles.chatTimestampRow}>
                        {hasLastMessage && isMyMessage && (
                          <span className={styles.chatStatusIcon} aria-hidden="true">
                            <img
                              src={sentIcon}
                              alt="Sent"
                              className={`${styles.chatStatusIconImage} ${
                                lastMessageSeen ? '' : styles.chatStatusIconVisible
                              }`}
                            />
                            <img
                              src={seenIcon}
                              alt="Seen"
                              className={`${styles.chatStatusIconImage} ${
                                lastMessageSeen ? styles.chatStatusIconVisible : ''
                              }`}
                            />
                          </span>
                        )}
                        {hasLastMessage && (
                          <span className={styles.timestamp}>
                            {convertISOtoLocal(chat.last_message.when)}
                          </span>
                        )}
                      </span>
                      {unreadCount > 0 && (
                        <span className={styles.notificationBadge}>
                          <p>{unreadCount}</p>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <button
          onClick={handleNewConversation}
          className={styles.newConversationButton}
          aria-label="New Conversation"
        >
          <FontAwesomeIcon icon={faAddressBook} />
        </button>
      </aside>
  
      <main
        className={`${styles.chatMain} ${hasWallpaper ? styles.chatMainWallpaper : ''}`}
        style={wallpaperStyle}
      >
        {selectedChat ? (
          <>
            <div className={styles.chatHeader}>
              {/* Mobile Back Button */}
              <button
                type="button"
                className={styles.mobileBackButton}
                onClick={handleCloseChat}
                aria-label="Back to chats"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <div className={styles.UserStatus}>
                <div className={`${styles.statusAvatar} ${styles.statusAvatarLarge}`}>
                  {selectedChat.type === "pv" ? (
                    <button
                      type="button"
                      className={styles.profileAvatarButton}
                      onClick={() => {
                        const contactId = selectedChat.contact_info?._id || selectedChat.contact_info?.id;
                        if (contactId) {
                          navigate(`/members/${contactId}`);
                        }
                      }}
                    >
                      <ProfileAvatar
                        size="md"
                        alt={selectedChat.contact_info?.username}
                        src={selectedChat.contact_info?.profile_pic}
                      />
                    </button>
                  ) : (
                    <ProfileAvatar
                      size="md"
                      alt={selectedChat.group_name}
                      src={selectedChat.group_avatar}
                    />
                  )}
                  {selectedChat.type === "pv" && (
                    <span
                      className={`${styles.statusDot} ${
                        selectedChat.contact_info?.status === 'online'
                          ? styles.statusDotOnline
                          : styles.statusDotOffline
                      }`}
                    />
                  )}
                </div>
                <div>
                  <h2>
                    {selectedChat.type === "pv" ? (
                      <button
                        type="button"
                        className={styles.profileLink}
                        onClick={() => {
                          const contactId = selectedChat.contact_info?._id || selectedChat.contact_info?.id;
                          if (contactId) {
                            navigate(`/members/${contactId}`);
                          }
                        }}
                      >
                        {selectedChat.contact_info?.username}
                      </button>
                    ) : (
                      selectedChat.group_name
                    )}
                  </h2>
                  {selectedChat.type === "pv" ? (
                    <p
                      className={`${styles.onlineStatus} ${
                        selectedChat.contact_info?.status === 'online'
                          ? styles.statusTextOnline
                          : styles.statusTextOffline
                      }`}
                    >
                      {selectedChat.contact_info?.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                  ) : (
                    <p className={styles.onlineStatus}>Group</p>
                  )}
                </div>
              </div>
              <div ref={chatMenuRef} className={styles.chatMenuWrapper}>
                <button
                  type="button"
                  className={styles.optionsButton}
                  onClick={() => setIsChatMenuOpen((prev) => !prev)}
                  aria-label="Conversation options"
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>
                {isChatMenuOpen && (
                  <div className={`${styles.optionsMenu} ${styles.optionsMenuDown}`}>
                    <button
                      type="button"
                      className={styles.optionsMenuItem}
                      onClick={() => handleOpenDeleteConversation(selectedChat)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Delete conversation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
  
            <div 
              className={styles.messagesContainer}
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              {isLoadingMessages && visibleMessages.length === 0 && (
                <div className={styles.loadingMessages}>
                  <div className={styles.loadingCenter}>
                    <div className={styles.loadingPulse}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
              {shouldHoldGroupMessages && visibleMessages.length > 0 && (
                <div className={styles.loadingMessages}>
                  <div className={styles.loadingCenter}>
                    <div className={styles.loadingPulse}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={loadMoreSentinelRef} className={styles.loadMoreSentinel} aria-hidden="true" />
              {!isLoadingMessages && visibleMessages.length === 0 && (
                <div className={styles.emptyMessages}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              {isLoadingMessages && visibleMessages.length > 0 && (
                <div className={styles.loadingMore} role="status">
                  <span className={styles.lazyLoadSpinner} />
                  <span>Loading older messages</span>
                </div>
              )}
              <div className={styles.messagesWrapper}>
              {!shouldHoldGroupMessages && visibleMessages.map((message, index) => {
                  // --- START NEW DATE SEPARATOR LOGIC ---
                  const currentMsgDate = message.created_at || message.when;
                  const prevMsgDate = index > 0 ? (visibleMessages[index - 1].created_at || visibleMessages[index - 1].when) : null;
                  
                  // Check if the day changed
                  const currentDateObj = new Date(currentMsgDate).toDateString();
                  const prevDateObj = prevMsgDate ? new Date(prevMsgDate).toDateString() : null;
                  const showDateSeparator = !prevDateObj || currentDateObj !== prevDateObj;

                  // --- EXISTING VARIABLE LOGIC (Keep exactly as you have it) ---
                  // The backend user object uses `_id` (MongoDB ObjectId), not `id`.
                  // Reading `user?.id` here yielded `undefined`, which combined with
                  // absent optional fields (e.g. message.sender_id) caused
                  // `undefined === undefined` to be true for EVERY message,
                  // so every bubble rendered as "sent". Use `_id` with an `id` fallback.
                  const userId = user?._id || user?.id;
                  const messageSenderId = getSenderId(message)?.toString();
                  // Only compare when we have a real sender id, to avoid the
                  // `undefined === undefined` false-positive.
                  const currentUserId = userId?.toString() || userId;
                  const isMyMessage = Boolean(messageSenderId && currentUserId) &&
                    messageSenderId === currentUserId;
                  const messageId = message._id || message.id || `msg-${index}`;
                  const messageContent = message.content || message.text || '';
                  const messageTime = message.when || message.timestamp || message.created_at;
                  const isPrivateChat = selectedChat?.type === 'pv';
                  const isGroupChat = selectedChat?.type === 'group';
                  const replyPreview = message.reply_to || message.replyTo || message.reply_to_message;
                  const resolvedMediaUrl = resolvedMediaUrls[messageId] || '';
                  const mediaUrl = getMessageMediaUrl(message) || resolvedMediaUrl;
                  const messageType = message.type || (mediaUrl ? 'file' : 'text');
                  const resolvedMessageType = getRenderableMediaType({
                    ...message,
                    type: messageType,
                  });
                  const isMediaReady = Boolean(mediaUrl);
                  const isMedia = Boolean(mediaUrl || message?.attachment_key);
                  const isManualMediaLoading = Boolean(manualMediaLoading[messageId]);
                  const mediaPreviewUrl = mediaPreviewUrls[messageId] || '';
                  const showMediaDownloadPreview = Boolean(
                    message?.attachment_key
                    && !mediaUrl
                    && !['document', 'file'].includes(resolvedMessageType)
                    && !autoDownloadMedia
                  );
                  const isMediaResolving = Boolean(
                    message?.attachment_key
                    && !mediaUrl
                    && autoDownloadMedia
                    && !showMediaDownloadPreview
                    && !['document', 'file'].includes(resolvedMessageType)
                  );
                  const hasMediaCaption = isMedia && Boolean(messageContent.trim());
                  const hasReplyMedia = isMedia && Boolean(replyPreview);
                  const showMediaFooter = isMedia && !hasMediaCaption;
                  const isDocument = resolvedMessageType === 'document'
                    || resolvedMessageType === 'file'
                    || (messageType === 'document');
                  const isMediaOnly = isMedia && !messageContent.trim() && !replyPreview;
                  const isEmojiOnly = isEmojiOnlyMessage(messageContent);
                  const shouldUseEmojiOnlyStyle = isEmojiOnly && !replyPreview && !isMedia;
                  const replyPreviewText = truncateMessage(
                    replyPreview?.content || replyPreview?.text || getMessagePreviewText(replyPreview),
                    80
                  );
                  const senderIdStr = messageSenderId;
                  const senderInfo = !isMyMessage && isGroupChat ? senderInfoCache[senderIdStr] : null;
                  const shouldShowSenderMeta = !isMyMessage && isGroupChat;
                  const senderName = shouldShowSenderMeta
                    ? (senderInfo?.username
                        || message.sender_username
                        || message.sender_name
                        || message.sender_info?.username
                        || 'Member')
                    : null;
                  const senderAvatar = shouldShowSenderMeta
                    ? (senderInfo?.profile_pic || message.sender_info?.profile_pic || null)
                    : null;
                  const isGifMessage = resolvedMessageType === 'gif';
                  const deliveryStatus = isMyMessage && (isPrivateChat || isGifMessage)
                    ? (message?.status || 'sent')
                    : null;
                  // Upload progress for this media message (0..100) while it's being uploaded
                  const uploadProgressValue = mediaUploadProgress[messageId];
                  const isUploadingMedia = isMyMessage
                    && typeof uploadProgressValue === 'number'
                    && uploadProgressValue < 100;
                  const messageRenderKey = message?.client_id || messageId;
                  const messageAnimKey = (message?.client_id || messageId)?.toString();

                  // Reusable footer (time + seen) — rendered inside media cards for media messages.
                  const messageFooterMarkup = (
                    <>
                      {message?.edited && (
                        <span className={styles.editedBadge}>edited</span>
                      )}
                      <span className={styles.timestamp}>
                        {convertISOtoLocal(messageTime)}
                      </span>
                      {isMyMessage && (isPrivateChat || isGifMessage) && (
                        <span className={styles.seenIcon}>
                          {deliveryStatus === 'pending' && (
                            <span className={styles.deliveryClock} title="Sending">
                              <span className={styles.deliveryClockFace} />
                              <span className={styles.deliveryClockHandShort} />
                              <span className={styles.deliveryClockHandLong} />
                            </span>
                          )}
                          {deliveryStatus === 'error' && (
                            <button
                              type="button"
                              className={styles.deliveryErrorButton}
                              onClick={() => handleResendMessage(message)}
                              title="Message failed. Click to resend."
                            >
                              <FontAwesomeIcon icon={faCircleExclamation} />
                            </button>
                          )}
                          {deliveryStatus === 'sent' && (
                            <img
                              src={message?.seen ? seenIcon : sentIcon}
                              alt={message?.seen ? "Seen" : "Sent"}
                              className={styles.seenIconImage}
                            />
                          )}
                        </span>
                      )}
                    </>
                  );
                  
                  // --- RETURN JSX ---
                  return (
                    <React.Fragment key={messageRenderKey}>
                      {/* Render Date Separator if day changed */}
                      {showDateSeparator && (
                        <div className={styles.dateSeparator}>
                          <span className={styles.dateSeparatorText}>
                            {formatDateSeparator(currentMsgDate)}
                          </span>
                        </div>
                      )}

                      <div
                        className={`${
                          styles.messageWrapper
                        } ${
                          isMyMessage ? styles.messageWrapperSent : styles.messageWrapperReceived
                        } ${
                          !isMyMessage && isGroupChat ? styles.messageWrapperGroup : ''
                        } ${
                          (messageAnimKey && animatedMessageIdsRef.current.has(messageAnimKey))
                            || messageAnimKey === lastAnimatedMessageId
                            ? styles.messageEnter
                            : ''
                        }`}
                        ref={(el) => {
                          const id = messageId?.toString();
                          if (!id) return;
                          if (el) {
                            messageRefs.current.set(id, el);
                          } else {
                            messageRefs.current.delete(id);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setMessageContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            message,
                            isMyMessage,
                          });
                        }}
                        onDoubleClick={() => handleReplyToMessage(message)}
                      >
                        {shouldShowSenderMeta && (
                          <div className={styles.messageAvatar}>
                            <button
                              type="button"
                              className={styles.profileAvatarButton}
                              onClick={() => {
                                if (senderIdStr) {
                                  navigate(`/members/${senderIdStr}`);
                                }
                              }}
                            >
                              <ProfileAvatar
                                src={senderAvatar}
                                size={36}
                                alt={senderName || 'Member'}
                                borderWidth={0}
                              />
                            </button>
                          </div>
                        )}
                        <div
                          className={`${styles.message} ${isMyMessage ? styles.sent : styles.received} ${
                            shouldUseEmojiOnlyStyle ? styles.emojiOnly : ''
                          } ${isMediaOnly ? styles.mediaOnly : ''} ${hasMediaCaption ? styles.mediaWithCaption : ''} ${hasReplyMedia ? styles.mediaWithReply : ''}`}
                          data-message-type={isMyMessage ? 'sent' : 'received'}
                        >
                          {replyPreview && (
                            <div
                              className={styles.replyPreview}
                              role="button"
                              tabIndex={0}
                              onClick={() => scrollToMessage(replyPreview?.messageId || replyPreview?.message_id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  scrollToMessage(replyPreview?.messageId || replyPreview?.message_id);
                                }
                              }}
                            >
                              <div className={styles.replyPreviewLine} />
                              <div className={styles.replyPreviewContent}>
                                <div className={styles.replyPreviewHeader}>
                                  <span className={styles.replyPreviewLabel}>
                                    {(() => {
                                      const replySenderId = getSenderId(replyPreview)?.toString();
                                      const currentUserId = (user?._id || user?.id)?.toString();
                                      if (replySenderId && currentUserId && replySenderId === currentUserId) return 'You';
                                      if (selectedChat?.type === 'pv') {
                                        return selectedChat?.contact_info?.username || 'User';
                                      }
                                      return replyPreview?.sender_info?.username
                                        || replyPreview?.sender_name
                                        || replyPreview?.sender_username
                                        || replyPreview?.sender
                                        || 'Member';
                                    })()}
                                  </span>
                                </div>
                                <p className={styles.replyPreviewText}>
                                  {replyPreviewText}
                                </p>
                              </div>
                            </div>
                          )}
                          {shouldShowSenderMeta && (
                            <div className={styles.messageSenderName}>
                              <button
                                type="button"
                                className={styles.profileLinkInline}
                                onClick={() => {
                                  const senderId = messageSenderId;
                                  if (senderId) {
                                    navigate(`/members/${senderId}`);
                                  }
                                }}
                              >
                                {senderName}
                              </button>
                            </div>
                          )}
                          {isUploadingMedia && !isGifMessage && (
                            <div className={styles.mediaUploadOverlay}>
                              <button
                                type="button"
                                className={styles.mediaUploadCircle}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCancelMediaUpload(messageId);
                                }}
                                aria-label={`Cancel upload of ${getMessageFileName(message) || 'media'}`}
                                title="Cancel upload"
                                style={{
                                  background: `conic-gradient(var(--btn-color) ${uploadProgressValue * 3.6}deg, rgba(255,255,255,0.25) 0deg)`,
                                }}
                              >
                                <div className={styles.mediaUploadCircleInner}>
                                  <FontAwesomeIcon icon={faXmark} className={styles.mediaUploadCancelIcon} />
                                  <span className={styles.mediaUploadPercent}>
                                    {Math.round(uploadProgressValue)}%
                                  </span>
                                </div>
                              </button>
                            </div>
                          )}
                          {showMediaDownloadPreview && !isDocument && (
                            ['voice', 'audio'].includes(resolvedMessageType) ? (
                              <div className={`${styles.audioManualCard} ${isMediaOnly ? styles.audioManualCardOnly : ''}`}>
                                <button
                                  type="button"
                                  className={styles.audioDownloadButton}
                                  onClick={() => loadMediaMessage(message)}
                                  disabled={isManualMediaLoading}
                                  aria-label={isManualMediaLoading ? 'Downloading audio' : 'Download audio'}
                                >
                                  {isManualMediaLoading ? (
                                    <span className={styles.mediaManualSpinner} />
                                  ) : (
                                    <FontAwesomeIcon icon={faDownload} />
                                  )}
                                </button>
                                <div className={styles.audioManualInfo}>
                                  <strong>{getMessageFileName(message) || 'Audio message'}</strong>
                                  <span>{isManualMediaLoading ? 'Downloading audio…' : 'Download to play'}</span>
                                </div>
                                {isMediaOnly && (
                                  <span className={styles.mediaManualFooter}>
                                    {messageFooterMarkup}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                className={`${styles.mediaManualPreview} ${
                                  resolvedMessageType === 'video'
                                    ? styles.mediaManualPreviewVideo
                                    : styles.mediaManualPreviewVisual
                                } ${
                                  isManualMediaLoading ? styles.mediaManualPreviewLoading : ''
                                }`}
                                onClick={() => loadMediaMessage(message)}
                                disabled={isManualMediaLoading}
                                aria-label={isManualMediaLoading
                                  ? `Downloading ${resolvedMessageType} media`
                                  : `Download ${resolvedMessageType} media`}
                              >
                                {mediaPreviewUrl && resolvedMessageType === 'video' && (
                                  <video
                                    className={styles.mediaManualPreviewMedia}
                                    src={mediaPreviewUrl}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    aria-hidden="true"
                                  />
                                )}
                                {mediaPreviewUrl && resolvedMessageType !== 'video' && (
                                  <img
                                    className={styles.mediaManualPreviewMedia}
                                    src={mediaPreviewUrl}
                                    alt=""
                                    aria-hidden="true"
                                  />
                                )}
                                <span className={styles.mediaManualBlur} aria-hidden="true" />
                                <span className={styles.mediaManualAction}>
                                  <span className={styles.mediaManualIcon}>
                                    {isManualMediaLoading ? (
                                      <span className={styles.mediaManualSpinner} />
                                    ) : (
                                      <FontAwesomeIcon icon={resolvedMessageType === 'video' ? faVideo : faImage} />
                                    )}
                                  </span>
                                  <strong>
                                    {isManualMediaLoading
                                      ? `Downloading ${resolvedMessageType === 'video' ? 'video' : 'media'}…`
                                      : `Download ${resolvedMessageType === 'video' ? 'video' : 'media'}`}
                                  </strong>
                                  <small>{isManualMediaLoading ? 'Preparing media' : 'Tap to load'}</small>
                                </span>
                                {isMediaOnly && (
                                  <span className={styles.mediaManualFooter}>
                                    {messageFooterMarkup}
                                  </span>
                                )}
                              </button>
                            )
                          )}
                          {isMediaResolving && !isDocument && (
                            <div
                              className={`${styles.mediaResolvingCard} ${
                                ['voice', 'audio'].includes(resolvedMessageType)
                                  ? styles.mediaResolvingAudio
                                  : resolvedMessageType === 'video'
                                    ? styles.mediaResolvingVideo
                                    : styles.mediaResolvingVisual
                              } ${
                                isMediaOnly && ['voice', 'audio'].includes(resolvedMessageType)
                                  ? styles.mediaResolvingAudioOnly
                                  : ''
                              }`}
                              role="status"
                              aria-label="Loading media"
                            >
                              <span className={styles.mediaResolvingSpinner} />
                              <span>Loading media</span>
                              {isMediaOnly && (
                                <span className={styles.mediaManualFooter}>
                                  {messageFooterMarkup}
                                </span>
                              )}
                            </div>
                          )}
                          {isMediaReady && (resolvedMessageType === 'video') && (
                            <VideoPlayer
                              src={mediaUrl}
                              mimeType={message?.mime_type || 'video/mp4'}
                              footer={showMediaFooter ? messageFooterMarkup : undefined}
                            />
                          )}
                          {isMediaReady && (resolvedMessageType === 'voice' || resolvedMessageType === 'audio') && (
                            <AudioPlayer
                              src={mediaUrl}
                              fileName={getMessageFileName(message)}
                              isVoice={resolvedMessageType === 'voice'}
                              accent={isMyMessage ? 'rgba(255,255,255,0.82)' : 'var(--chat-accent)'}
                              footer={showMediaFooter ? messageFooterMarkup : undefined}
                            />
                          )}
                          {isDocument && (
                            <div className={styles.mediaDocumentWrap}>
                              <button
                                type="button"
                                className={styles.fileAttachment}
                                onClick={() => (mediaUrl
                                  ? handleDownloadMessage(message)
                                  : loadMediaMessage(message))}
                                disabled={isManualMediaLoading || (autoDownloadMedia && !mediaUrl)}
                                aria-label={`Download ${getMessageFileName(message) || 'attachment'}`}
                              >
                                <span className={styles.fileAttachmentIcon}>
                                  <span>{getFileExtension(getMessageFileName(message))}</span>
                                  <FontAwesomeIcon icon={faFileSolid} />
                                </span>
                                <span className={styles.fileAttachmentInfo}>
                                  <span className={styles.fileAttachmentName}>
                                    {getMessageFileName(message) || 'Attachment'}
                                  </span>
                                  <span className={styles.fileAttachmentSize}>
                                    {message?.file_size ? formatFileSize(message.file_size) : 'Document'}
                                    {!mediaUrl
                                      ? (isManualMediaLoading || autoDownloadMedia ? ' · preparing' : ' · tap to download')
                                      : ''}
                                  </span>
                                </span>
                                <span className={styles.fileAttachmentDownload}>
                                  {isManualMediaLoading || (autoDownloadMedia && !mediaUrl)
                                    ? <span className={styles.filePreparingSpinner} />
                                    : <FontAwesomeIcon icon={faDownload} />}
                                </span>
                              </button>
                              {showMediaFooter && (
                                <div className={styles.mediaDocumentFooter}>
                                  {messageFooterMarkup}
                                </div>
                              )}
                            </div>
                          )}
                          {isMediaReady && !isDocument && !['video', 'voice', 'audio'].includes(resolvedMessageType) && (
                            <div className={styles.mediaImageWrap}>
                              <button
                                type="button"
                                className={styles.mediaImageButton}
                                onClick={() => {
                                  setMediaViewer({
                                    url: mediaUrl,
                                    message,
                                    type: resolvedMessageType,
                                  });
                                }}
                                aria-label="Open media viewer"
                              >
                                <img
                                  src={mediaUrl}
                                  alt={getMessageFileName(message) || resolvedMessageType}
                                  className={`${styles.messageMedia} ${
                                  resolvedMessageType === 'sticker'
                                    ? styles.messageMediaSticker
                                    : resolvedMessageType === 'gif'
                                      ? styles.messageMediaGif
                                      : styles.messageMediaImage
                                }`}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </button>
                              {resolvedMessageType !== 'sticker' && (
                                <button
                                  type="button"
                                  className={styles.mediaQuickDownload}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDownloadMessage(message);
                                  }}
                                  aria-label="Download media"
                                >
                                  <FontAwesomeIcon icon={faDownload} />
                                </button>
                              )}
                              {showMediaFooter && (
                                <div className={styles.mediaImageFooter}>
                                  {messageFooterMarkup}
                                </div>
                              )}
                            </div>
                          )}
                          {hasMediaCaption ? (
                            <div className={styles.mediaCaptionBlock}>
                              <p dir="auto" className={styles.mediaCaptionText}>{messageContent}</p>
                              <div className={`${styles.messageFooter} ${styles.mediaCaptionFooter}`}>
                                {messageFooterMarkup}
                              </div>
                            </div>
                          ) : (
                            messageContent.trim() && (
                              <p dir="auto" className={styles.messageText}>{messageContent}</p>
                            )
                          )}
                          {!isMedia && !hasMediaCaption && (
                            <div className={styles.messageFooter}>
                              {messageFooterMarkup}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {showJumpToLatest && visibleMessages.length > 0 && (
              <button
                type="button"
                className={styles.jumpToLatestButton}
                onClick={handleJumpToLatest}
                aria-label="Jump to latest message"
                title="Jump to latest message"
              >
                <FontAwesomeIcon icon={faArrowDown} aria-hidden="true" />
              </button>
            )}
  
            {mediaViewer && createPortal(
              <div
                className={styles.mediaViewerBackdrop}
                role="dialog"
                aria-modal="true"
                aria-label="Media viewer"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setMediaViewer(null);
                }}
              >
                <div className={styles.mediaViewerToolbar}>
                  <span>{getMessageFileName(mediaViewer.message) || (mediaViewer.type === 'gif' ? 'GIF' : 'Photo')}</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleDownloadMessage(mediaViewer.message)}
                      aria-label="Download media"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                    </button>
                    <button type="button" onClick={() => setMediaViewer(null)} aria-label="Close media viewer">
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                </div>
                <img src={mediaViewer.url} alt={getMessageFileName(mediaViewer.message) || 'Shared media'} />
              </div>,
              document.body
            )}

            {pendingMediaItems.length > 0 && selectedPendingMedia && (
              <div
                className={styles.mediaUploadBackdrop}
                role="dialog"
                aria-modal="true"
                aria-labelledby="media-upload-title"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) closePendingMedia();
                }}
              >
                <section className={styles.mediaUploadDialog}>
                  <header className={styles.mediaUploadHeader}>
                    <div>
                      <h2 id="media-upload-title">Send media</h2>
                      <p>{pendingMediaItems.length} of {MAX_MEDIA_BATCH} selected · 20 MB maximum each</p>
                    </div>
                    <button
                      type="button"
                      className={styles.mediaUploadClose}
                      onClick={closePendingMedia}
                      aria-label="Close media preview"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </header>

                  <div className={styles.mediaUploadPreview}>
                    {selectedPendingMedia.type === 'image' && (
                      <img src={selectedPendingMedia.previewUrl} alt={selectedPendingMedia.file.name} />
                    )}
                    {selectedPendingMedia.type === 'video' && (
                      <video src={selectedPendingMedia.previewUrl} controls preload="metadata" />
                    )}
                    {(selectedPendingMedia.type === 'voice' || selectedPendingMedia.type === 'file') && (
                      <div className={styles.mediaFilePreview}>
                        <span className={styles.mediaFilePreviewIcon}>
                          <FontAwesomeIcon
                            icon={selectedPendingMedia.type === 'voice' ? faMusic : faFileLines}
                          />
                        </span>
                        <strong>{selectedPendingMedia.file.name}</strong>
                        <span>{formatFileSize(selectedPendingMedia.file.size)}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.mediaPreviewRemove}
                      onClick={() => removePendingMedia(selectedPendingMedia.id)}
                      aria-label={`Remove ${selectedPendingMedia.file.name}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>

                  <div className={styles.mediaThumbnailRail} aria-label="Selected files">
                    {pendingMediaItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.mediaThumbnail} ${
                          item.id === selectedPendingMedia.id ? styles.mediaThumbnailActive : ''
                        }`}
                        onClick={() => setSelectedPendingMediaId(item.id)}
                        aria-label={`Preview ${item.file.name}${item.caption ? ' (has caption)' : ''}`}
                      >
                        {item.type === 'image' && <img src={item.previewUrl} alt="" />}
                        {item.type === 'video' && (
                          <>
                            <video src={item.previewUrl} muted preload="metadata" />
                            <FontAwesomeIcon icon={faVideo} />
                          </>
                        )}
                        {(item.type === 'voice' || item.type === 'file') && (
                          <FontAwesomeIcon icon={item.type === 'voice' ? faMusic : faFileLines} />
                        )}
                        {Boolean(item.caption?.trim()) && (
                          <span className={styles.mediaThumbnailCaptioned} aria-hidden="true" />
                        )}
                      </button>
                    ))}
                    {pendingMediaItems.length < MAX_MEDIA_BATCH && (
                      <button
                        type="button"
                        className={`${styles.mediaThumbnail} ${styles.mediaThumbnailAdd}`}
                        onClick={() => openAttachmentPicker('file-upload')}
                        aria-label="Add more files"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    )}
                  </div>

                  <div className={styles.mediaUploadComposer}>
                    <div className={styles.mediaCaptionField}>
                      <textarea
                        value={selectedPendingMedia.caption || ''}
                        onChange={(event) => updatePendingMediaCaption(
                          selectedPendingMedia.id,
                          event.target.value.slice(0, MAX_MESSAGE_LENGTH)
                        )}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            handleSendPendingMedia();
                          }
                        }}
                        rows={1}
                        placeholder={
                          pendingMediaItems.length > 1
                            ? `Add a caption to ${getMessageFileName(selectedPendingMedia.file) || 'this file'}...`
                            : 'Add a caption...'
                        }
                        aria-label={`Caption for ${getMessageFileName(selectedPendingMedia.file) || 'selected media'}`}
                      />
                      <span>{(selectedPendingMedia.caption || '').length}/{MAX_MESSAGE_LENGTH}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.mediaSendButton}
                      onClick={handleSendPendingMedia}
                      aria-label={`Send ${pendingMediaItems.length} selected ${pendingMediaItems.length === 1 ? 'file' : 'files'}`}
                    >
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                  </div>
                </section>
              </div>
            )}

            <div className={styles.inputBar}>
            <input
              id="media-upload"
              type="file"
              multiple
              accept="image/*,video/*"
              hidden
              onChange={handleFileChange}
              title="Maximum file size is 20 MB"
            />
            <input
              id="file-upload"
              type="file"
              multiple
              hidden
              onChange={handleFileChange}
              title="Maximum file size is 20 MB"
            />
            <input
              id="audio-upload"
              type="file"
              multiple
              accept="audio/*,.aac,.flac,.m4a,.mp3,.ogg,.opus,.wav,.weba,.wma"
              hidden
              onChange={handleFileChange}
              title="Maximum file size is 20 MB"
            />
            
            {/* Left Actions */}
            <div className={styles.inputActionsLeft}>
              <div className={styles.optionsMenuContainer} ref={optionsMenuRef}>
                <button
                  type="button"
                  className={`${styles.actionButton} ${isOptionsMenuOpen ? styles.attachmentButtonActive : ''}`}
                  onClick={handleOptionsMenuToggle}
                  aria-label="Attach media or file"
                  aria-expanded={isOptionsMenuOpen}
                >
                  <FontAwesomeIcon icon={faPaperclip} />
                </button>
                {isOptionsMenuOpen && (
                  <div className={styles.optionsMenu}>
                    <button
                      type="button"
                      className={`${styles.optionsMenuItem} ${styles.attachmentMenuItem}`}
                      onClick={handleUploadMediaClick}
                    >
                      <span className={`${styles.attachmentMenuIcon} ${styles.attachmentMenuIconMedia}`}>
                        <FontAwesomeIcon icon={faImage} />
                      </span>
                      <span>
                        <strong>Photo or video</strong>
                        <small>Share from your library</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.optionsMenuItem} ${styles.attachmentMenuItem}`}
                      onClick={handleUploadFileClick}
                    >
                      <span className={`${styles.attachmentMenuIcon} ${styles.attachmentMenuIconFile}`}>
                        <FontAwesomeIcon icon={faFileSolid} />
                      </span>
                      <span>
                        <strong>File</strong>
                        <small>Send any file up to 20 MB</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.optionsMenuItem} ${styles.attachmentMenuItem}`}
                      onClick={handleUploadMusicClick}
                    >
                      <span className={`${styles.attachmentMenuIcon} ${styles.attachmentMenuIconMusic}`}>
                        <FontAwesomeIcon icon={faCompactDisc} />
                      </span>
                      <span>
                        <strong>Music</strong>
                        <small>Share an audio file up to 20 MB</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.optionsMenuItem} ${styles.attachmentMenuItem}`}
                      onClick={handleSendLocationClick}
                    >
                      <span className={`${styles.attachmentMenuIcon} ${styles.attachmentMenuIconLocation}`}>
                        <FontAwesomeIcon icon={faLocationDot} />
                      </span>
                      <span>
                        <strong>Location</strong>
                        <small>Share your current position</small>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Composer (textarea + reply bar) */}
            <div className={styles.composer}>
              {replyingToMessage && (
                <div className={styles.replyBar}>
                  <div className={styles.replyBarIndicator} />
                  <div className={styles.replyBarContent}>
                    <div className={styles.replyBarHeader}>
                      <span className={styles.replyBarLabel}>
                        {(() => {
                          const senderId = getSenderId(replyingToMessage)?.toString();
                          const currentUserId = (user?._id || user?.id)?.toString();
                          if (senderId && currentUserId && senderId === currentUserId) return 'You';
                          if (selectedChat?.type === 'pv') {
                            return selectedChat?.contact_info?.username || 'User';
                          }
                          return replyingToMessage?.sender_info?.username
                            || replyingToMessage?.sender_name
                            || replyingToMessage?.sender_username
                            || 'Member';
                        })()}
                      </span>
                      {replyingToMessage?.type && replyingToMessage?.type !== 'text' && (
                        <span className={styles.replyBarType}>
                          {replyingToMessage.type === 'image' ? '📷 Photo' :
                          replyingToMessage.type === 'video' ? '🎥 Video' :
                          replyingToMessage.type === 'gif' ? '🎬 GIF' :
                          replyingToMessage.type === 'sticker' ? '🎨 Sticker' :
                          replyingToMessage.type === 'voice' ? '🎤 Voice' :
                          replyingToMessage.type === 'audio' ? '🎵 Audio' :
                          '📎 File'}
                        </span>
                      )}
                    </div>
                    <p className={styles.replyBarText}>
                      {truncateMessage(
                        replyingToMessage?.content
                          || replyingToMessage?.text
                          || getMessagePreviewText(replyingToMessage),
                        80
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.replyBarClose}
                    onClick={() => setReplyingToMessage(null)}
                    aria-label="Cancel reply"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              )}
              <textarea
                className={styles.messageTextarea}
                placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (editingMessage) {
                      if (messageInput.trim().length <= MAX_MESSAGE_LENGTH) {
                        handleEditSubmit();
                      }
                    } else {
                      if (messageInput.trim().length <= MAX_MESSAGE_LENGTH) {
                        handleSendMessage();
                      }
                    }
                  }
                  if (e.key === 'Escape' && editingMessage) {
                    e.preventDefault();
                    handleEditCancel();
                  }
                }}
              />
            </div>

            {/* Right Actions */}
            <div className={styles.inputActionsRight}>
              {/* Emoji Button */}
              <div className={styles.mediaPickerWrapper} ref={mediaPickerRef}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => setIsMediaPickerOpen((prev) => !prev)}
                  aria-label="Open emojis and GIFs"
                >
                  <FontAwesomeIcon icon={faFaceSmile} />
                </button>
                {isMediaPickerOpen && (
                  <div className={styles.mediaPicker}>
                    <div className={styles.mediaTabs}>
                      <button
                        type="button"
                        className={`${styles.mediaTab} ${mediaTab === 'emoji' ? styles.mediaTabActive : ''}`}
                        onClick={() => setMediaTab('emoji')}
                      >
                        Emoji
                      </button>
                      <button
                        type="button"
                        className={`${styles.mediaTab} ${mediaTab === 'gifs' ? styles.mediaTabActive : ''}`}
                        onClick={() => setMediaTab('gifs')}
                      >
                        GIFs
                      </button>

                    </div>
                    {mediaTab === 'emoji' && (
                      <div className={styles.emojiPane}>
                        <EmojiPicker
                          className={styles.emojiPicker}
                          open
                          theme="auto"
                          onEmojiClick={(emojiData) => {
                            setMessageInput((prev) => prev + emojiData.emoji);
                          }}
                        />
                      </div>
                    )}
                    {mediaTab !== 'emoji' && (
                      <>
                        {mediaTab === 'gifs' && (
                          <div className={styles.mediaSearch}>
                            <input
                              type="text"
                              placeholder="Search GIFs"
                              value={gifQuery}
                              onChange={(event) => setGifQuery(event.target.value)}
                            />
                          </div>
                        )}
                        {giphyError && mediaTab === 'gifs' && (
                          <p className={styles.mediaError}>{giphyError}</p>
                        )}
                        {isGiphyLoading && mediaTab === 'gifs' && (
                          <p className={styles.mediaLoading}>Loading GIFs...</p>
                        )}
                        {!isGiphyLoading && !giphyError && mediaTab === 'gifs' && activeMediaItems.length === 0 && (
                          <p className={styles.mediaEmpty}>No GIFs found.</p>
                        )}
                        <div className={styles.mediaGrid}>
                          {activeMediaItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className={styles.mediaItem}
                              onClick={() => handleSendMedia(item)}
                            >
                              <img src={item.preview || item.url} alt={item.name} />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Recording Indicator */}
              {isRecording && (
                <div className={styles.recordingIndicator}>
                  <span className={styles.recordingDot} />
                  <span className={styles.recordingTime}>{formatDuration(recordingDuration)}</span>
                </div>
              )}

              {/* Edit Mode Buttons */}
              {editingMessage && (
                <>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.editCancelButton}`}
                    onClick={handleEditCancel}
                    aria-label="Cancel edit"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.editSaveButton}`}
                    onClick={handleEditSubmit}
                    aria-label="Save edit"
                    disabled={messageInput.trim().length > MAX_MESSAGE_LENGTH}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                </>
              )}

              {/* Record/Send Button */}
              {!editingMessage && (
                <div className={`${styles.sendButtonWrapper} ${isSwitching ? (messageInput.trim() ? 'switching-in' : 'switching-out') : ''}`}>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.primaryButton} ${isRecording ? styles.recordingActive : ''} ${messageInput.trim() ? styles.hasText : ''}`}
                    onClick={isRecording ? stopRecording : (messageInput.trim() ? handleSendMessage : startRecording)}
                    disabled={!isRecording && messageInput.trim().length > MAX_MESSAGE_LENGTH}
                    aria-label={isRecording ? 'Stop recording' : (messageInput.trim() ? 'Send message' : 'Record voice')}
                  >
                    {isRecording ? (
                      <FontAwesomeIcon icon={faStop} />
                    ) : messageInput.trim() ? (
                      <img src={sendIcon} alt="Send" className={styles.sendIcon} />
                    ) : (
                      <FontAwesomeIcon icon={faMicrophone} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

            {messageContextMenu && (
              <div
                className={styles.messageContextMenu}
                data-message-context-menu
                style={{ left: messageContextMenu.x, top: messageContextMenu.y }}
                ref={messageContextMenuRef}
              >
                <button
                  type="button"
                  className={styles.optionsMenuItem}
                  onClick={() => handleReplyToMessage(messageContextMenu.message)}
                >
                  <FontAwesomeIcon icon={faReply} />
                  <span>Reply</span>
                </button>
                {(() => {
                  const m = messageContextMenu.message;
                  const hasMedia = Boolean(getMessageMediaUrl(m) || m?.attachment_key);
                  if (!hasMedia) return null;
                  return (
                    <button
                      type="button"
                      className={styles.optionsMenuItem}
                      onClick={() => handleDownloadMessage(m)}
                    >
                      <FontAwesomeIcon icon={faDownload} />
                      <span>Download</span>
                    </button>
                  );
                })()}
                {messageContextMenu.isMyMessage && (
                  <button
                    type="button"
                    className={styles.optionsMenuItem}
                    onClick={() => {
                      const m = messageContextMenu.message;
                      setEditingMessage(m);
                      setMessageInput(m?.content || m?.text || '');
                      setMessageContextMenu(null);
                      setReplyingToMessage(null);
                    }}
                  >
                    <FontAwesomeIcon icon={faPen} />
                    <span>Edit</span>
                  </button>
                )}
                {messageContextMenu.isMyMessage && (
                  <button
                    type="button"
                    className={styles.optionsMenuItem}
                    onClick={() => handleDeleteMessage(messageContextMenu.message)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                  </button>
                )}
                {messageContextMenu.isMyMessage && messageContextMenu.message?.status === 'error' && (
                  <button
                    type="button"
                    className={styles.optionsMenuItem}
                    onClick={() => {
                      handleResendMessage(messageContextMenu.message);
                      setMessageContextMenu(null);
                    }}
                  >
                    <FontAwesomeIcon icon={faCircleExclamation} />
                    <span>Resend</span>
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={styles.noChatSelected}>
            <div className={styles.emptyChatMessage}>
              <p className={styles.emptyChatTitle}>
                {randomIcon && <img src={randomIcon} alt="Welcome" className={styles.welcomeIcon} />}
                Welcome back
              </p>
              <p className={styles.emptyChatSubtitle}>Pick a conversation to start talking</p>
            </div>
          </div>
        )}
        {conversationContextMenu && (
          <div
            className={styles.conversationContextMenu}
            data-conversation-context-menu
            style={{ left: conversationContextMenu.x, top: conversationContextMenu.y }}
          >
            <button
              type="button"
              className={styles.optionsMenuItem}
              onClick={() => handleOpenDeleteConversation(conversationContextMenu.conversation)}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>Delete conversation</span>
            </button>
          </div>
        )}
        {deleteConfirm.open && (
          <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
            <div className={styles.confirmBox}>
              <p className={styles.confirmTitle}>Delete conversation?</p>
              <p className={styles.confirmText}>
                Choose whether to delete just for you or for everyone.
              </p>
              <div className={styles.confirmActions}>
                <label className={styles.deleteCheckbox}>
                  <input
                    type="checkbox"
                    checked={deleteForEveryone}
                    onChange={(event) => setDeleteForEveryone(event.target.checked)}
                    disabled={isDeletingConversation}
                  />
                  <span>
                    {deleteTargetName ? `Delete for ${deleteTargetName}` : 'Delete for contact'}
                  </span>
                </label>
                <div className={styles.confirmButtons}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setDeleteConfirm({ open: false, conversationId: null })}
                    disabled={isDeletingConversation}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.confirmButton}
                    onClick={() => handleDeleteConversation(deleteForEveryone ? 'all' : 'me')}
                    disabled={isDeletingConversation}
                  >
                    {isDeletingConversation ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {deleteLastMessageAlert.open && (
          <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
            <div className={styles.confirmBox}>
              <p className={styles.confirmTitle}>Attention</p>
              <p className={styles.confirmText}>
                By deleting this message the conversation will be gone
              </p>
              <div className={styles.confirmButtons}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancelDeleteLastMessage}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmButton}
                  onClick={handleConfirmDeleteLastMessage}
                >
                  Anyway
                </button>
              </div>
            </div>
          </div>
        )}
        {messageDeleteConfirm.open && (
          <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
            <div className={styles.confirmBox}>
              <p className={styles.confirmTitle}>Delete message?</p>
              <p className={styles.confirmText}>
                Choose whether to delete this message just for you or for everyone.
              </p>
              <div className={styles.confirmActions}>
                <label className={styles.deleteCheckbox}>
                  <input
                    type="checkbox"
                    checked={deleteMessageForEveryone}
                    onChange={(event) => setDeleteMessageForEveryone(event.target.checked)}
                  />
                  <span>Delete for everyone</span>
                </label>
                <div className={styles.confirmButtons}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancelDeleteMessage}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.confirmButton}
                    onClick={handleConfirmDeleteMessage}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
  
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={handleCloseModal}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}

export default ChatsPage;
