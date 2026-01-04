import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useCallback, useMemo } from 'react';
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
} from '@fortawesome/free-solid-svg-icons';
import { faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import { Sidebar, Input, Button, ProfileAvatar } from '@/shared/components';
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
import NewConversationModal from '../../components/NewConversationModal/NewConversationModal';
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

const stickerOptions = monoIcons.map((src, index) => ({
  id: `sticker-${index + 1}`,
  name: `sticker-${index + 1}`,
  url: src,
}));

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MESSAGES_LIMIT = 10; // Max number of messages per request

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
  const content = message.content || message.text;
  if (content) return content;
  switch (message.type) {
    case 'image':
      return 'Photo';
    case 'video':
      return 'Video';
    case 'gif':
      return 'GIF';
    case 'sticker':
      return 'Sticker';
    case 'voice':
      return 'Voice message';
    case 'audio':
      return 'Audio';
    case 'file':
      return 'Attachment';
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

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    const base64 = typeof result === 'string' ? result.split(',').pop() : '';
    if (!base64) {
      reject(new Error('Unable to read file.'));
      return;
    }
    resolve(base64);
  };
  reader.onerror = () => reject(reader.error || new Error('Unable to read file.'));
  reader.readAsDataURL(file);
});

const uploadMediaFile = async (file) => {
  const base64 = await fileToBase64(file);
  const response = await fetch('/api/v1/chat/media', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      file: base64,
      mime_type: file.type,
      name: file.name,
      size: file.size,
    }),
  });

  if (!response.ok) {
    throw new Error('Unable to upload media right now.');
  }

  const data = await response.json();
  return data?.url || data?.file_url || data?.media_url || data?.data?.url || '';
};

const getMediaTypeFromFile = (file) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'voice';
  return 'file';
};

const getMediaTypeFromMime = (mimeType) => {
  if (!mimeType) return null;
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'voice';
  return null;
};

function ChatsPage() {
  const { user } = useAuth();
  const { socket, status: socketStatus } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState('gifs');
  const [gifQuery, setGifQuery] = useState('');
  const [giphyGifs, setGiphyGifs] = useState([]);
  const [isGiphyLoading, setIsGiphyLoading] = useState(false);
  const [giphyError, setGiphyError] = useState('');
  const [wallpaperId, setWallpaperId] = useState(() => {
    if (typeof window === 'undefined') {
      return 'aurora';
    }
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'aurora';
  });
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [messageContextMenu, setMessageContextMenu] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [randomIcon, setRandomIcon] = useState(null);
  const [lastAnimatedMessageId, setLastAnimatedMessageId] = useState(null);
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
  const pendingMessagesRef = useRef({});
  const pendingSendMapRef = useRef({});
  const pendingAckTimersRef = useRef({});
  const recentReceiveRef = useRef({});
  const seenSentRef = useRef({});
  const messageAnimationTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);

  const [unreadCounts, setUnreadCounts] = useState({});
  const unreadCountsRef = useRef({});

  const isAtBottomRef = useRef(false);
  
  const scrollToBottom = useCallback(() => {
    const el = messagesEndRef.current;
    const container = messagesContainerRef.current;
    if (el) {
      el.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

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

  const handleSendMessage = useCallback(() => {
    const content = messageInput.trim();
    if (!content) {
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
      conversation_id: conversationId,
      sender: user?.id,
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
        pendingPvRef.current = { tempId: conversationId };
        socket.emit(
          SOCKET_EVENTS.NEW_PV_CONVERSATION,
          {
            new_user_id: contactUserId,
            message_text: content,
            date: new Date().toISOString(),
            track_id: optimisticId,
          },
          (ack) => {
            if (!ack?.ok) {
              toast.error(ack?.error || 'Unable to send message.');
              return;
            }

            const newConversationId = ack?.conversationId || ack?.conversation?._id || ack?.conversation?.id;
            if (newConversationId) {
              setContacts((prev) =>
                prev.map((chat) =>
                  getConversationId(chat) === conversationId
                    ? { ...chat, _id: newConversationId, id: newConversationId }
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
                  return serverMessage;
                }
                return m;
              })
            );
          }
        );
        return;
      }

      socket.emit(
        SOCKET_EVENTS.MESSAGE_SEND,
        {
          conversation_id: conversationId,
          message_text: content,
          track_id: optimisticId,
        }
      );
    } catch (err) {
      console.error('Failed to emit socket message:', err);
      toast.error('Unable to send message right now.');
    }
  }, [messageInput, replyingToMessage, scrollToBottom, selectedChat, socket, user?.id]);

  const handleEditSubmit = useCallback(() => {
    const content = messageInput.trim();
    const msg = editingMessage;
    if (!msg) return;
    if (!content) {
      toast.error('Message cannot be empty.');
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

    socket.emit(
      SOCKET_EVENTS.MESSAGE_EDIT,
      {
        conversationId,
        messageId,
        content,
      },
      (ack) => {
        if (!ack?.ok) {
          toast.error(ack?.error || 'Unable to edit message.');
        }
      }
    );

    setEditingMessage(null);
    setMessageInput('');
  }, [editingMessage, messageInput, selectedChat, socket]);

  const handleEditCancel = useCallback(() => {
    setEditingMessage(null);
    setMessageInput('');
  }, []);

  const handleDeleteMessage = useCallback(
    (message) => {
      const messageId = getMessageId(message);
      const conversationId = getConversationId(selectedChat);
      if (!messageId || !conversationId) return;

      // Optimistic remove
      setMessages((prev) => prev.filter((m) => getMessageId(m) !== messageId));
      setMessageContextMenu(null);

      if (!socket || !socket.connected) {
        toast.error('Not connected.');
        return;
      }

      socket.emit(
        SOCKET_EVENTS.MESSAGE_DELETE,
        {
          conversationId,
          messageId,
        },
        (ack) => {
          if (!ack?.ok) {
            toast.error(ack?.error || 'Unable to delete message.');
          }
        }
      );
    },
    [selectedChat, socket]
  );

  const handleReplyToMessage = useCallback((message) => {
    setReplyingToMessage(message);
    setMessageContextMenu(null);
  }, []);

  const handleResendMessage = useCallback((message) => {
    const conversationId = message?.conversation_id;
    const content = message?.content || message?.text;
    if (!conversationId || !content) {
      toast.error('Unable to resend message.');
      return;
    }

    if (!socket || !socket.connected) {
      toast.error('Not connected.');
      return;
    }

    const messageId = getMessageId(message);
    if (messageId) {
      setMessages((prev) =>
        prev.map((m) =>
          getMessageId(m) === messageId ? { ...m, status: 'pending' } : m
        )
      );
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

    socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
      conversation_id: conversationId,
      message_text: content,
      track_id: messageId,
    });
  }, [socket]);

  const handleDeleteConversation = useCallback(() => {
    const conversationId = getConversationId(selectedChat);
    if (!conversationId) return;

    // Optimistic remove
    setContacts((prev) => prev.filter((c) => getConversationId(c) !== conversationId));
    setSelectedChat(null);
    setMessages([]);
    setIsChatMenuOpen(false);

    if (!socket || !socket.connected) {
      toast.error('Not connected.');
      return;
    }

    socket.emit(
      SOCKET_EVENTS.CONVERSATION_DELETE,
      { conversationId },
      (ack) => {
        if (!ack?.ok) {
          toast.error(ack?.error || 'Unable to delete conversation.');
        }
      }
    );
  }, [selectedChat, socket]);

  // Refresh conversations list
  const refreshContacts = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/user/conversations', {
        method: "GET",
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        const next = (data.conversations || []).map((chat) => {
          const id = getConversationId(chat)?.toString();
          const cachedUnread = id ? unreadCountsRef.current[id] : 0;
          const serverUnread = chat.unread_count || 0;
          return {
            ...chat,
            unread_count: Math.max(serverUnread, cachedUnread),
          };
        });
        setContacts(next);
        setUnreadCounts(() => {
          const merged = { ...unreadCountsRef.current };
          next.forEach((chat) => {
            const id = getConversationId(chat)?.toString();
            if (!id) return;
            const unread = chat.unread_count || 0;
            if (unread > (merged[id] || 0)) {
              merged[id] = unread;
            }
          });
          unreadCountsRef.current = merged;
          return merged;
        });
        return next;
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
    return [];
  }, []);
  
  // Messages state
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [messagesConversationId, setMessagesConversationId] = useState(null);
  const messagesContainerRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const messagesOffsetRef = useRef(0);
  const hasMoreMessagesRef = useRef(true);
  const isInitialLoadRef = useRef(true);
  const lastScrollTimeRef = useRef(0);
  const previousTopRef = useRef(0);
  const previousScrollTopRef = useRef(0);
  const pendingPrependRef = useRef(false);
  const nearTopTimeoutRef = useRef(null);

  useEffect(() => {
    messagesOffsetRef.current = messagesOffset;
  }, [messagesOffset]);

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

  const emitSeenForMessage = useCallback(
    (message, conversationIdStr) => {
      if (!socket || !socket.connected) return;
      if (selectedChatRef.current?.type !== 'pv') return;
      if (!message || !conversationIdStr) return;

      const messageId = getMessageId(message);
      if (!messageId) return;
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
    if (!socket) {
      return;
    }

    const handleAnyEvent = (eventName, payload) => {
      console.log('[socket]', eventName, payload);
    };

    const storeRecentReceive = (conversationIdStr, messageText) => {
      if (!conversationIdStr || !messageText) return;
      const now = Date.now();
      const list = recentReceiveRef.current[conversationIdStr] || [];
      recentReceiveRef.current[conversationIdStr] = [...list, { text: messageText, ts: now }]
        .filter((item) => now - item.ts < 4000);
    };

    const hasRecentReceive = (conversationIdStr, messageText) => {
      if (!conversationIdStr || !messageText) return false;
      const now = Date.now();
      const list = recentReceiveRef.current[conversationIdStr] || [];
      const match = list.some((item) => item.text === messageText && now - item.ts < 4000);
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
      if (!conversationId || !messageText) {
        return;
      }
      const conversationIdStr = conversationId?.toString();
      if (hasRecentReceive(conversationIdStr, messageText)) {
        return;
      }
      storeRecentReceive(conversationIdStr, messageText);

      const messageId = payload?.message_id || `receive-${Date.now()}`;
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
        _id: messageId,
        id: messageId,
        conversation_id: conversationId,
        sender: messageSender,
        type: 'text',
        content: messageText,
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
      const isActiveConversation = selectedConversationIdStr && selectedConversationIdStr === conversationIdStr;
      let isMissingInList = false;

      setContacts((prev) => {
        const next = [...prev];
        const idx = next.findIndex(
          (c) => getConversationId(c)?.toString() === conversationIdStr
        );
        if (idx === -1) {
          isMissingInList = true;
          return prev;
        }

        const chat = next[idx];
        const nextUnread = isActiveConversation ? 0 : (chat?.unread_count || 0) + 1;
        next[idx] = {
          ...chat,
          last_message: {
            content: messageText,
            type: 'text',
            sender: payload?.senderUsername || payload?.sender || chat?.last_message?.sender || '',
            when: message.created_at,
          },
          unread_count: nextUnread,
        };

        const [moved] = next.splice(idx, 1);
        next.unshift(moved);
        return next;
      });

      if (isMissingInList) {
        setUnreadCount(conversationIdStr, (count) => count + 1);
        refreshContacts();
        return;
      }

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
      animatedMessageIdsRef.current.add(messageId);
      setLastAnimatedMessageId(messageId);
      if (messageAnimationTimeoutRef.current) {
        clearTimeout(messageAnimationTimeoutRef.current);
      }
      messageAnimationTimeoutRef.current = setTimeout(() => {
        setLastAnimatedMessageId(null);
      }, 600);

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
    };

    const handleMessageSendError = (payload) => {
      const trackId = payload?.track_id || payload?.trackId;
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
      if (activeConversationId && activeConversationId !== conversationId.toString()) {
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          getMessageId(m) === messageId ? { ...m, seen: true } : m
        )
      );
      const conversationIdStr = conversationId.toString();
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
      if (hasRecentReceive(conversationIdStr, messageText)) {
        return;
      }

      setContacts((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => getConversationId(c) === conversationId);
        if (idx === -1) return prev;

        const chat = next[idx];

        next[idx] = {
          ...chat,
          last_message: {
            content: getMessagePreviewText(message),
            type: message?.type ?? 'text',
            sender: payload?.senderUsername || payload?.sender || chat?.last_message?.sender || '',
            when: message?.created_at || new Date().toISOString(),
          },
        };

        const [moved] = next.splice(idx, 1);
        next.unshift(moved);
        return next;
      });

      const activeConversationId = activeConversationIdRef.current;
      if (activeConversationId && activeConversationId.toString() === conversationIdStr) {
        animatedMessageIdsRef.current.add(messageId);
        setMessages((prev) => {
          const exists = prev.some((m) => getMessageId(m) === messageId);
          if (exists) return prev;
          const messageSenderId = getSenderId(message)?.toString();
          const messageTime = new Date(message?.created_at || message?.when || 0).getTime();
          const replaced = prev.map((m) => {
            const mid = getMessageId(m)?.toString() || '';
            if (!mid.startsWith('receive-')) return m;
            const senderId = getSenderId(m)?.toString();
            if (!senderId || senderId !== messageSenderId) return m;
            const content = m?.content || m?.text || '';
            if (content !== messageText) return m;
            const mTime = new Date(m?.created_at || m?.when || 0).getTime();
            if (messageTime && mTime && Math.abs(messageTime - mTime) > 60000) return m;
            return message;
          });
          const didReplace = replaced.some((m) => getMessageId(m) === messageId);
          return didReplace ? replaced : [...replaced, message];
        });
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

    const handleMessageUpdated = (payload) => {
      const message = payload?.message;
      const conversationId = payload?.conversationId || payload?.conversation_id || message?.conversation_id;
      const messageId = payload?.messageId || getMessageId(message);
      if (!conversationId || !messageId) return;

      if (activeConversationIdRef.current !== conversationId) {
        return;
      }

      setMessages((prev) => prev.map((m) => (getMessageId(m) === messageId ? { ...m, ...message } : m)));
    };

    const handleMessageDeleted = (payload) => {
      const conversationId = payload?.conversationId || payload?.conversation_id;
      const messageId = payload?.messageId;
      if (!conversationId || !messageId) return;

      if (activeConversationIdRef.current !== conversationId) {
        return;
      }

      setMessages((prev) => prev.filter((m) => getMessageId(m) !== messageId));
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

      if (activeConversationIdRef.current === conversationId) {
        setSelectedChat(null);
        setMessages([]);
      }
    };

    const handleGenericMessage = (payload) => {
      const messageText = payload?.message;
      const newConversationId = payload?.conversationId || payload?.conversation_id;
      const pending = pendingPvRef.current;
      if (messageText !== 'Conversation created' || !newConversationId || !pending?.tempId) {
        return;
      }

      const tempId = pending.tempId;
      setContacts((prev) =>
        prev.map((chat) =>
          getConversationId(chat) === tempId
            ? { ...chat, _id: newConversationId, id: newConversationId }
            : chat
        )
      );
      setSelectedChat((prev) =>
        prev && getConversationId(prev) === tempId
          ? { ...prev, _id: newConversationId, id: newConversationId }
          : prev
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.conversation_id === tempId
            ? { ...m, conversation_id: newConversationId }
            : m
        )
      );
      setMessagesConversationId(newConversationId);
      pendingPvRef.current = null;
    };

    const handleNewPvConversation = (payload) => {
      const conversationId = payload?.conversation_id || payload?.conversationId;
      if (!conversationId) {
        return;
      }
      refreshContacts();
      refreshTimeoutsRef.current.push(setTimeout(refreshContacts, 600));
      refreshTimeoutsRef.current.push(setTimeout(refreshContacts, 1500));
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, handleMessageReceive);
    socket.on(SOCKET_EVENTS.MESSAGE_SEND_ACK, handleMessageSendAck);
    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.CONVERSATION_DELETED, handleConversationDeleted);
    socket.on('message', handleGenericMessage);
    socket.on('error', handleMessageSendError);
    socket.on(SOCKET_EVENTS.NEW_PV_CONVERSATION, handleNewPvConversation);
    socket.onAny(handleAnyEvent);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
      socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE, handleMessageReceive);
      socket.off(SOCKET_EVENTS.MESSAGE_SEND_ACK, handleMessageSendAck);
      socket.off(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.CONVERSATION_DELETED, handleConversationDeleted);
      socket.off('message', handleGenericMessage);
      socket.off('error', handleMessageSendError);
      socket.off(SOCKET_EVENTS.NEW_PV_CONVERSATION, handleNewPvConversation);
      socket.offAny(handleAnyEvent);
      refreshTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      refreshTimeoutsRef.current = [];
      Object.values(pendingAckTimersRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
      pendingAckTimersRef.current = {};
      if (messageAnimationTimeoutRef.current) {
        clearTimeout(messageAnimationTimeoutRef.current);
      }
    };
  }, [emitSeenForMessage, setUnreadCount, socket, refreshContacts]);

  useEffect(() => {
    const nextConversationId = getConversationId(selectedChat);
    const nextConversationIdStr = nextConversationId?.toString();
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

  }, [selectedChat, setUnreadCount, socket, socketStatus]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setIsChatMenuOpen(false);
      }
      if (messageContextMenu && event.target?.closest && event.target.closest('[data-message-context-menu]') === null) {
        setMessageContextMenu(null);
      }
    };

    if (isChatMenuOpen || messageContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isChatMenuOpen, messageContextMenu]);

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
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/v1/user/conversations', {
          method: "GET",
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setContacts(data.conversations || []);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    const handleNewPvEvent = () => {
      refreshContacts();
      refreshTimeoutsRef.current.push(setTimeout(refreshContacts, 600));
      refreshTimeoutsRef.current.push(setTimeout(refreshContacts, 1500));
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

  // Cleanup file preview URL
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

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
            url: item.images?.fixed_height_small?.url || item.images?.original?.url,
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
        if (!mid || existingIds.has(mid)) return;
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

        if (append) {
          // Prepend older messages to the beginning
          // Use functional update to access current messages state
          setMessages((prevMessages) => {
            const existingIds = new Set(
              prevMessages.map((msg) => (msg._id || msg.id)?.toString()).filter(Boolean)
            );
            const newMessages = sortedFetchedMessages.filter((msg) => {
              const msgId = (msg._id || msg.id)?.toString();
              return msgId && !existingIds.has(msgId);
            });
            return [...newMessages, ...prevMessages];
          });
          flushPendingMessages(conversationId);
          if (sortedFetchedMessages.length === 0) {
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
            setMessages(sortedFetchedMessages);
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

  const loadOlderMessages = useCallback(() => {
    if (!selectedChat) {
      return;
    }

    if (isLoadingMoreRef.current || isLoadingMessages) {
      return;
    }

    if (!hasMoreMessagesRef.current) {
      return;
    }

    const conversationId = selectedChat?._id || selectedChat?.id;
    if (!conversationId) {
      return;
    }

    fetchMessages(conversationId, messagesOffsetRef.current, true);
  }, [fetchMessages, isLoadingMessages, selectedChat]);

  // Fetch messages when selectedChat changes
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      setMessagesOffset(0);
      setHasMoreMessages(true);
      setMessagesConversationId(null);
      setSenderInfoCache({}); // Clear cache when chat changes
      isInitialLoadRef.current = true;
      return;
    }

    const conversationId = selectedChat._id || selectedChat.id;
    if (!conversationId) return;

    // Reset state and fetch initial messages (last 10 messages)
    setMessages([]);
    setMessagesOffset(0);
    setHasMoreMessages(true);
    setMessagesConversationId(conversationId.toString());
    setSenderInfoCache({}); // Clear cache
    isInitialLoadRef.current = true;
    if (!conversationId.toString().startsWith('temp-')) {
      fetchMessages(conversationId, 0, false);
    }
  }, [selectedChat, fetchMessages]);

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
      fetch(`/api/v1/members/${senderIdStr}/info`, {
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

  // Handle scroll for lazy loading older messages
  const handleScroll = useCallback((e) => {
    const container = e.currentTarget;

    // Track whether user is near the bottom so we can auto-scroll on new messages
    // without pulling them down while reading older history.
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;
    isAtBottomRef.current = distanceFromBottom < 6;

    // if at absolute top, trigger immediately (no throttle) to avoid missing the final event
    const atAbsoluteTop = container.scrollTop <= 2;
    if (atAbsoluteTop) {
      loadOlderMessages();
      previousTopRef.current = container.scrollTop;
      return;
    }

    // throttle for other scroll events
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 120) {
      // schedule a trailing near-top check to catch the final inertial stop
      clearTimeout(nearTopTimeoutRef.current);
      nearTopTimeoutRef.current = setTimeout(() => {
        if (!messagesContainerRef.current) return;
        if (isLoadingMoreRef.current || isLoadingMessages) return;
        if (!hasMoreMessagesRef.current) return;
        if (messagesContainerRef.current.scrollTop <= 10) {
          loadOlderMessages();
        }
      }, 80);
      return;
    }
    lastScrollTimeRef.current = now;

    // gate concurrent loads
    if (isLoadingMoreRef.current || isLoadingMessages) {
      previousTopRef.current = container.scrollTop;
      return;
    }

    const nearTop = container.scrollTop <= 10;

    if (nearTop) {
      loadOlderMessages();
    }

    previousTopRef.current = container.scrollTop;
  }, [isLoadingMessages, loadOlderMessages]);

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
  }, [emitSeenForMessage, messages, selectedChat]);

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

  // Reset file upload state
  const resetFileUploadState = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

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
        setIsNewConversationModalOpen(false);
        return;
      }

      // 2) Otherwise, optimistically add the selected user to the contacts list
      const tempId = `temp-${Date.now()}`;

      const optimisticChat = {
        id: tempId,
        _id: tempId,
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
      setIsNewConversationModalOpen(false);
    },
    [contacts, user]
  );

  // Handle options menu toggle
  const handleOptionsMenuToggle = useCallback(() => {
    setIsOptionsMenuOpen((prev) => !prev);
  }, []);

  // Handle upload file option click
  const handleUploadFileClick = useCallback(() => {
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
      setIsOptionsMenuOpen(false);
    }
  }, []);

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

  const sendMediaMessage = useCallback(
    async ({ file, type, previewUrl, caption }) => {
      if (!file) return;

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
      if (isPendingPv) {
        toast.error('Send a text message first to start the conversation.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 5MB.');
        return;
      }

      const replyTo = replyingToMessage
        ? {
            messageId: getMessageId(replyingToMessage),
            content: replyingToMessage?.content
              || replyingToMessage?.text
              || getMessagePreviewText(replyingToMessage),
            sender: replyingToMessage?.sender,
          }
        : null;

      setReplyingToMessage(null);
      setFilePreview(previewUrl);
      setSelectedFile(file);
      setIsUploading(true);
      setUploadProgress(10);

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage = {
        _id: optimisticId,
        id: optimisticId,
        conversation_id: conversationId,
        sender: user?.id,
        type,
        content: caption || '',
        created_at: new Date().toISOString(),
        edited: false,
        reply_to: replyTo,
        local_preview: previewUrl,
        file_name: file.name,
        mime_type: file.type,
      };

      animatedMessageIdsRef.current.add(optimisticId);
      setMessages((prev) => [...prev, optimisticMessage]);
      shouldAutoScrollRef.current = true;
      scrollToBottom();

      try {
        setUploadProgress(35);
        const uploadedUrl = await uploadMediaFile(file);
        if (!uploadedUrl) {
          throw new Error('Upload did not return a media url.');
        }
        setUploadProgress(70);

        const response = await fetch('/api/v1/chat/messages/media', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            type,
            message_text: caption || '',
            media_url: uploadedUrl,
            file_name: file.name,
            mime_type: file.type,
            file_size: file.size,
            reply_to: replyTo?.messageId || null,
          }),
        });

        if (!response.ok) {
          throw new Error('Unable to send media.');
        }

        const data = await response.json();
        const serverMessage = data?.message;
        const serverMessageId = getMessageId(serverMessage);
        if (serverMessage && serverMessageId) {
          setMessages((prev) =>
            prev.map((m) => {
              const mid = getMessageId(m);
              if (mid === optimisticId) {
                return serverMessage;
              }
              return m;
            })
          );
        }
      } catch (error) {
        console.error('Failed to send media:', error);
        toast.error('Unable to send media right now.');
        setMessages((prev) => prev.filter((m) => getMessageId(m) !== optimisticId));
      } finally {
        setUploadProgress(100);
        setTimeout(resetFileUploadState, 300);
      }
    },
    [replyingToMessage, resetFileUploadState, scrollToBottom, selectedChat, user?.id]
  );

  // Handle file upload
  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      const type = getMediaTypeFromFile(file);
      await sendMediaMessage({ file, type, previewUrl });
      event.target.value = '';
    },
    [sendMediaMessage]
  );

  const handleSendMedia = useCallback(
    async (media) => {
      if (!selectedChat) {
        toast.error('Please select a chat before sending media.');
        return;
      }

      const mediaUrl = media?.url;
      if (!mediaUrl) return;

      try {
        const response = await fetch(mediaUrl);
        if (!response.ok) {
          throw new Error('Unable to fetch media.');
        }

        const blob = await response.blob();
        const rawExtension = blob.type?.split('/')[1] || 'gif';
        const extension = rawExtension.includes('svg') ? 'svg' : rawExtension;
        const file = new File([blob], `${media.name}.${extension}`, {
          type: blob.type || 'image/gif',
        });
        const previewUrl = mediaUrl;
        const type = mediaTab === 'stickers' ? 'sticker' : 'gif';
        await sendMediaMessage({ file, type, previewUrl });
      } catch (error) {
        console.error('Failed to send media:', error);
        toast.error('Unable to send media right now.');
      } finally {
        setIsMediaPickerOpen(false);
      }
    },
    [mediaTab, selectedChat, sendMediaMessage]
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

  // Cleanup trailing near-top timeout on chat change/unmount
  useEffect(() => {
    return () => {
      if (nearTopTimeoutRef.current) {
        clearTimeout(nearTopTimeoutRef.current);
      }
    };
  }, [selectedChat]);

  const activeMediaItems = mediaTab === 'stickers' ? stickerOptions : giphyGifs;
  const resolvedWallpaper = useMemo(() => {
    return wallpapers.find((wallpaper) => wallpaper.id === wallpaperId)
      || wallpapers.find((wallpaper) => wallpaper.id === 'aurora');
  }, [wallpaperId]);
  const hasWallpaper = resolvedWallpaper?.src && wallpaperId !== 'none';
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
  const shouldRenderMessages = activeChatIdStr && activeChatIdStr === messagesConversationIdStr;
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
  const isPreviewImage = selectedFile?.type?.startsWith('image/');
  const isPreviewVideo = selectedFile?.type?.startsWith('video/');

  return (
    <div className={styles.chatsPageContainer}>
      <Sidebar className={styles.sidebar} />

      <aside className={styles.chatListSidebar}>
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
              const isMyMessage = chat.last_message.sender === user?.username;
              const selectedId = getConversationId(selectedChat);
              const chatId = getConversationId(chat);
              const chatIdStr = chatId?.toString();
              const unreadCount = unreadCounts[chatIdStr] ?? chat.unread_count ?? 0;
              const avatarSrc = isPrivateChat 
                ? chat.contact_info?.profile_pic 
                : chat.group_avatar;
              const displayName = isPrivateChat 
                ? chat.contact_info?.username 
                : chat.group_name;

              return (
                <div
                  key={chatIdStr || chat._id || chat.id || index}
                  className={`${styles.chatItem} ${selectedId && chatId && selectedId === chatId ? styles.active : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <ProfileAvatar size="md" src={avatarSrc} />
                  <div className={styles.chatInfo}>
                    <div className={styles.chatInfoHeader}>
                      <h3>{displayName}</h3>
                      <p className={styles.lastMessage}>
                        {!isPrivateChat && !isMyMessage && (
                          <b>{chat.last_message.sender}: </b>
                        )}
                        {!isPrivateChat && isMyMessage && (
                          <span className={styles.youText}>You: </span>
                        )}
                        {truncateMessage(getMessagePreviewText(chat.last_message))}
                      </p>
                    </div>
                    <div className={styles.chatInfoFooter}>
                      <span className={styles.timestamp}>
                        {convertISOtoLocal(chat.last_message.when)}
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
              <div className={styles.UserStatus}>
                <ProfileAvatar 
                  size="md" 
                  alt={selectedChat.type === "pv" ? selectedChat.contact_info?.username : selectedChat.group_name}
                  src={selectedChat.type === "pv" ? selectedChat.contact_info?.profile_pic : selectedChat.group_avatar}
                />
                <div>
                  <h2>
                    {selectedChat.type === "pv" 
                      ? selectedChat.contact_info?.username 
                      : selectedChat.group_name}
                  </h2>
                  <p className={styles.onlineStatus}>Online</p>
                </div>
              </div>
              <div ref={chatMenuRef}>
                <button
                  type="button"
                  className={styles.optionsButton}
                  onClick={() => setIsChatMenuOpen((prev) => !prev)}
                  aria-label="Conversation options"
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>
                {isChatMenuOpen && (
                  <div className={styles.optionsMenu}>
                    <button
                      type="button"
                      className={styles.optionsMenuItem}
                      onClick={handleDeleteConversation}
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
              {!isLoadingMessages && visibleMessages.length === 0 && (
                <div className={styles.emptyMessages}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              {isLoadingMessages && visibleMessages.length > 0 && (
                <div className={styles.loadingMore}>
                  <div className={styles.loadingDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div className={styles.messagesWrapper}>
                {!shouldHoldGroupMessages && visibleMessages.map((message, index) => {
                  // Message detection: message.sender is an ObjectId that should match user.id
                  const userId = user?.id; // User object uses 'id' not '_id'
                  const username = user?.username;
                  
                  // Convert both to strings for comparison (message.sender can be ObjectId or string)
                  const messageSenderId = message.sender?.toString() || message.sender;
                  const currentUserId = userId?.toString() || userId;
                  
                  // Primary check: compare sender ObjectId with user.id
                  const isMyMessage = messageSenderId === currentUserId ||
                    // Fallback checks for different API response formats
                    message.sender === currentUserId ||
                    message.sender_id?.toString() === currentUserId ||
                    message.sender_id === currentUserId ||
                    message.user_id?.toString() === currentUserId ||
                    message.user_id === currentUserId ||
                    message.from_user_id?.toString() === currentUserId ||
                    message.from_user_id === currentUserId ||
                    // Username fallback (less reliable but included for compatibility)
                    message.sender === username ||
                    message.sender_name === username;
                  
                  const messageId = message._id || message.id || `msg-${index}`;
                  const messageContent = message.content || message.text || '';
                  const messageTime = message.when || message.timestamp || message.created_at;
                  const isPrivateChat = selectedChat?.type === 'pv';
                  const isGroupChat = selectedChat?.type === 'group';
                  const replyPreview = message.reply_to || message.replyTo || message.reply_to_message;
                  const mediaUrl = getMessageMediaUrl(message);
                  const messageType = message.type || (mediaUrl ? 'file' : 'text');
                  const resolvedMessageType = messageType === 'file'
                    ? (getMediaTypeFromMime(message?.mime_type) || 'file')
                    : messageType;
                  const isMedia = Boolean(mediaUrl);
                  const isMediaOnly = isMedia && !messageContent && !replyPreview
                    && (resolvedMessageType === 'sticker' || resolvedMessageType === 'gif');
                  const isEmojiOnly = isEmojiOnlyMessage(messageContent);
                  const shouldUseEmojiOnlyStyle = isEmojiOnly && !replyPreview && !isMedia;
                  const replyPreviewText = truncateMessage(
                    replyPreview?.content || replyPreview?.text || getMessagePreviewText(replyPreview),
                    80
                  );
                  
                  // Get sender info for group messages (received only)
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
                  
                  const deliveryStatus = isMyMessage && isPrivateChat
                    ? (message?.status || 'sent')
                    : null;
                  
                  return (
                    <div
                      key={messageId}
                      className={`${
                        styles.messageWrapper
                      } ${
                        isMyMessage ? styles.messageWrapperSent : styles.messageWrapperReceived
                      } ${
                        !isMyMessage && isGroupChat ? styles.messageWrapperGroup : ''
                      } ${
                        animatedMessageIdsRef.current.has(messageId) || messageId === lastAnimatedMessageId
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
                      {/* Avatar for received messages in groups - positioned on the left */}
                      {shouldShowSenderMeta && (
                        <div className={styles.messageAvatar}>
                          <ProfileAvatar 
                            src={senderAvatar} 
                            size={36}
                            alt={senderName || 'Member'}
                            borderWidth={0}
                          />
                        </div>
                      )}
                      
                      <div
                        className={`${styles.message} ${isMyMessage ? styles.sent : styles.received} ${
                          shouldUseEmojiOnlyStyle ? styles.emojiOnly : ''
                        } ${isMediaOnly ? styles.mediaOnly : ''}`}
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
                              <p className={styles.replyPreviewText}>
                                {replyPreviewText}
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Username inside message bubble for group chats */}
                        {shouldShowSenderMeta && (
                          <div className={styles.messageSenderName}>
                            <span className={styles.senderUsername}>{senderName}</span>
                          </div>
                        )}
                        
                        {isMedia && (resolvedMessageType === 'video') && (
                          <video
                            className={`${styles.messageMedia} ${styles.messageMediaVideo}`}
                            controls
                            preload="metadata"
                            playsInline
                            onLoadedMetadata={() => {
                              if (isInitialLoadRef.current) {
                                scrollToBottom();
                              }
                            }}
                          >
                            <source src={mediaUrl} type={message?.mime_type || 'video/mp4'} />
                          </video>
                        )}
                        {isMedia && (resolvedMessageType === 'voice' || resolvedMessageType === 'audio') && (
                          <audio
                            className={`${styles.messageMedia} ${styles.messageMediaAudio}`}
                            controls
                            preload="metadata"
                            src={mediaUrl}
                          />
                        )}
                        {isMedia && !['video', 'voice', 'audio'].includes(resolvedMessageType) && (
                          <img
                            src={mediaUrl}
                            alt={resolvedMessageType}
                            className={`${styles.messageMedia} ${
                              resolvedMessageType === 'sticker'
                                ? styles.messageMediaSticker
                                : resolvedMessageType === 'gif'
                                  ? styles.messageMediaGif
                                  : styles.messageMediaImage
                            }`}
                            onLoad={() => {
                              if (isInitialLoadRef.current) {
                                scrollToBottom();
                              }
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        {messageContent && <p>{messageContent}</p>}
                        <div className={styles.messageFooter}>
                          <span className={styles.timestamp}>
                            {convertISOtoLocal(messageTime)}
                          </span>
                          {isMyMessage && isPrivateChat && (
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
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {selectedFile && (
              <div className={styles.uploadProgress}>
                <div className={styles.filePreviewContainer}>
                  {filePreview && isPreviewImage && (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className={styles.filePreview}
                    />
                  )}
                  {filePreview && isPreviewVideo && (
                    <video
                      className={styles.filePreviewVideo}
                      src={filePreview}
                      muted
                      playsInline
                    />
                  )}
                  {(!filePreview || (!isPreviewImage && !isPreviewVideo)) && (
                    <div className={styles.filePreviewFallback}>
                      <FontAwesomeIcon icon={faFileSolid} />
                    </div>
                  )}
                  <div className={styles.fileInfo}>
                    <span className={styles.selectedFileName}>{selectedFile.name}</span>
                    <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <Button className={styles.cancelUpload} onClick={resetFileUploadState}>
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </div>
                {isUploading && (
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            )}

            {replyingToMessage && (
              <div className={styles.replyBarRow}>
                <div className={styles.replyBar}>
                  <div className={styles.replyBarContent}>
                    <p className={styles.replyBarTitle}>Replying to</p>
                    <p className={styles.replyBarText}>
                      {truncateMessage(
                        replyingToMessage?.content
                          || replyingToMessage?.text
                          || getMessagePreviewText(replyingToMessage),
                        60
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
              </div>
            )}

            <div className={styles.inputBar}>
              <div className={styles.optionsMenuContainer} ref={optionsMenuRef}>
                <button
                  type="button"
                  className={styles.optionsButton}
                  onClick={handleOptionsMenuToggle}
                  aria-label="More options"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                {isOptionsMenuOpen && (
                  <div className={styles.optionsMenu}>
                    <button
                      type="button"
                      className={styles.optionsMenuItem}
                      onClick={handleSendLocationClick}
                    >
                      <FontAwesomeIcon icon={faLocationDot} />
                      <span>Send Location</span>
                    </button>
                    <button
                      type="button"
                      className={styles.optionsMenuItem}
                      onClick={handleUploadFileClick}
                    >
                      <FontAwesomeIcon icon={faFileSolid} />
                      <span>Upload File</span>
                    </button>
                  </div>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*"
                title="Maximum file size is 5MB"
              />
              <div className={styles.composer}>
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
                        handleEditSubmit();
                      } else {
                        handleSendMessage();
                      }
                    }
                    if (e.key === 'Escape' && editingMessage) {
                      e.preventDefault();
                      handleEditCancel();
                    }
                  }}
                />
              </div>
              {editingMessage && (
                <>
                  <button
                    type="button"
                    className={styles.sendButton}
                    onClick={handleEditCancel}
                    aria-label="Cancel edit"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                  <button
                    type="button"
                    className={styles.sendButton}
                    onClick={handleEditSubmit}
                    aria-label="Save edit"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                </>
              )}
              <div className={styles.mediaPickerWrapper} ref={mediaPickerRef}>
                <button
                  type="button"
                  className={styles.mediaButton}
                  onClick={() => setIsMediaPickerOpen((prev) => !prev)}
                  aria-label="Open emojis, GIFs, and stickers"
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
                      <button
                        type="button"
                        className={`${styles.mediaTab} ${mediaTab === 'stickers' ? styles.mediaTabActive : ''}`}
                        onClick={() => setMediaTab('stickers')}
                      >
                        Stickers
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
              {isRecording && (
                <div className={styles.recordingIndicator}>
                  <span className={styles.recordingDot} />
                  <span className={styles.recordingTime}>{formatDuration(recordingDuration)}</span>
                </div>
              )}
              <button
                type="button"
                className={`${styles.recordButton} ${isRecording ? styles.recordButtonActive : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                aria-label={isRecording ? 'Stop recording' : 'Record voice'}
              >
                <FontAwesomeIcon icon={isRecording ? faStop : faMicrophone} />
              </button>
              {!editingMessage && (
                <button type="button" className={styles.sendButton} onClick={handleSendMessage}>
                  <img src={sendIcon} alt="Send" className={styles.sendIcon} />
                </button>
              )}
            </div>

            {messageContextMenu && (
              <div
                className={styles.messageContextMenu}
                data-message-context-menu
                style={{ left: messageContextMenu.x, top: messageContextMenu.y }}
              >
                <button
                  type="button"
                  className={styles.optionsMenuItem}
                  onClick={() => handleReplyToMessage(messageContextMenu.message)}
                >
                  <FontAwesomeIcon icon={faReply} />
                  <span>Reply</span>
                </button>

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
      </main>

      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={handleCloseModal}
        onSelectUser={handleSelectUser}
        existingContacts={contacts}
      />
    </div>
  );
}

export default ChatsPage;
