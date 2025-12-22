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
} from '@fortawesome/free-solid-svg-icons';
import { faFile, faFaceSmile } from '@fortawesome/free-regular-svg-icons';
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

const isEmojiOnlyMessage = (text) => {
  const normalized = text?.trim();
  if (!normalized) return false;
  return /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+$/u.test(normalized);
};

const getConversationId = (conversation) => conversation?._id || conversation?.id;
const getMessageId = (message) => message?._id || message?.id;

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
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState('gifs');
  const [gifQuery, setGifQuery] = useState('');
  const [giphyGifs, setGiphyGifs] = useState([]);
  const [isGiphyLoading, setIsGiphyLoading] = useState(false);
  const [giphyError, setGiphyError] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [messageContextMenu, setMessageContextMenu] = useState(null);
  const [randomIcon, setRandomIcon] = useState(null);
  const optionsMenuRef = useRef(null);
  const chatMenuRef = useRef(null);
  const mediaPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const animatedMessageIdsRef = useRef(new Set());

  const [unreadCounts, setUnreadCounts] = useState({});

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

    // Clear reply immediately to avoid UI sticking around if socket emits fail.
    setReplyingToMessage(null);

    const optimisticId = `optimistic-${Date.now()}`;
    const replyTo = replyingToMessage
      ? {
          messageId: getMessageId(replyingToMessage),
          content: replyingToMessage?.content || replyingToMessage?.text || '',
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
      seen_by: {},
      edited: false,
      reply_to: replyTo,
    };

    animatedMessageIdsRef.current.add(optimisticId);

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');
    shouldAutoScrollRef.current = true;

    try {
      if (!socket || !socket.connected) {
        toast.error('Not connected.');
        return;
      }

      socket.emit(
        SOCKET_EVENTS.MESSAGE_SEND,
        {
          conversationId,
          type: 'text',
          content,
          clientId: optimisticId,
          replyTo,
        },
        (ack) => {
          if (!ack?.ok) {
            toast.error(ack?.error || 'Unable to send message.');
            return;
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
  
  // Messages state
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const messagesContainerRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const messagesOffsetRef = useRef(0);
  const hasMoreMessagesRef = useRef(true);
  const isInitialLoadRef = useRef(true);
  const lastScrollTimeRef = useRef(0);
  const previousTopRef = useRef(0);
  const previousScrollTopRef = useRef(0);
  const nearTopTimeoutRef = useRef(null);

  useEffect(() => {
    messagesOffsetRef.current = messagesOffset;
  }, [messagesOffset]);

  useEffect(() => {
    hasMoreMessagesRef.current = hasMoreMessages;
  }, [hasMoreMessages]);
  
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
    if (!socket || !socket.connected) {
      return;
    }

    const handleMessageNew = (payload) => {
      const message = payload?.message;
      const conversationId = payload?.conversationId || payload?.conversation_id || message?.conversation_id;
      const messageId = getMessageId(message);
      if (!message || !conversationId || !messageId) {
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
            content: message?.content ?? '',
            type: message?.type ?? 'text',
            sender: payload?.senderUsername || payload?.sender || chat?.last_message?.sender || '',
            when: message?.created_at || new Date().toISOString(),
            seen: chat?.last_message?.seen ?? null,
          },
        };

        const [moved] = next.splice(idx, 1);
        next.unshift(moved);
        return next;
      });

      const activeConversationId = activeConversationIdRef.current;
      if (activeConversationId && activeConversationId === conversationId) {
        animatedMessageIdsRef.current.add(messageId);
        setMessages((prev) => {
          const exists = prev.some((m) => getMessageId(m) === messageId);
          if (exists) return prev;
          return [...prev, message];
        });
        if (isNearBottomRef.current) {
          shouldAutoScrollRef.current = true;
        }
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
    };

    const handleMessageUpdated = (payload) => {
      const message = payload?.message;
      const conversationId = payload?.conversationId || payload?.conversation_id || message?.conversation_id;
      const messageId = payload?.messageId || getMessageId(message);
      if (!conversationId || !messageId) return;

      setMessages((prev) => prev.map((m) => (getMessageId(m) === messageId ? { ...m, ...message } : m)));
    };

    const handleMessageDeleted = (payload) => {
      const conversationId = payload?.conversationId || payload?.conversation_id;
      const messageId = payload?.messageId;
      if (!conversationId || !messageId) return;

      setMessages((prev) => prev.filter((m) => getMessageId(m) !== messageId));
    };

    const handleSeenUpdate = (payload) => {
      const conversationId = payload?.conversationId || payload?.conversation_id;
      const messageId = payload?.messageId;
      const seenBy = payload?.seenBy;
      if (!conversationId || !messageId || !seenBy) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (getMessageId(m) !== messageId) return m;
          return {
            ...m,
            seen_by: seenBy,
          };
        })
      );
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

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.MESSAGE_SEEN_UPDATE, handleSeenUpdate);
    socket.on(SOCKET_EVENTS.CONVERSATION_DELETED, handleConversationDeleted);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.MESSAGE_SEEN_UPDATE, handleSeenUpdate);
      socket.off(SOCKET_EVENTS.CONVERSATION_DELETED, handleConversationDeleted);
    };
  }, [socket]);

  useEffect(() => {
    const nextConversationId = getConversationId(selectedChat);
    const prevConversationId = activeConversationIdRef.current;

    if (socket && socket.connected && prevConversationId && prevConversationId !== nextConversationId) {
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId: prevConversationId });
    }

    activeConversationIdRef.current = nextConversationId;

    if (!socket || !socket.connected || !nextConversationId) {
      return;
    }

    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: nextConversationId });
    setUnreadCounts((prev) => ({ ...prev, [nextConversationId]: 0 }));

    // Mark conversation as seen when opened (backend should translate to message-level seen updates)
    socket.emit(SOCKET_EVENTS.MESSAGE_SEEN, { conversationId: nextConversationId });
  }, [selectedChat, socket, socketStatus]);

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

  // Set random welcome icon on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * monoIcons.length);
    setRandomIcon(monoIcons[randomIndex]);
  }, []);

  // Cleanup file preview URL
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

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

  // Fetch messages function - implements lazy loading
  // Initial load: offset=0, limit=10 → fetches last 10 messages (newest)
  // Scroll up: offset=10,20,30... → fetches next 10 older messages each time
  const fetchMessages = useCallback(async (conversationId, offset = 0, append = false) => {
    if (!conversationId || isLoadingMoreRef.current) return;

    setIsLoadingMessages(true);
    isLoadingMoreRef.current = true;

    // Store scroll position before loading older messages
    const container = messagesContainerRef.current;
    if (container && append) {
      previousScrollHeightRef.current = container.scrollHeight;
      previousScrollTopRef.current = container.scrollTop;
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
        
        if (append) {
          // Prepend older messages to the beginning
          // Use functional update to access current messages state
          setMessages((prevMessages) => {
            // Create a map to deduplicate messages by ID
            const messagesMap = new Map();
            
            // Add existing messages to map
            prevMessages.forEach((msg) => {
              const msgId = msg._id || msg.id;
              if (msgId) messagesMap.set(msgId.toString(), msg);
            });
            
            // Add new older messages to map (will overwrite duplicates if any)
            sortedFetchedMessages.forEach((msg) => {
              const msgId = msg._id || msg.id;
              if (msgId) messagesMap.set(msgId.toString(), msg);
            });
            
            // Convert back to array and sort chronologically
            const combinedMessages = Array.from(messagesMap.values());
            const sortedCombined = sortMessagesByDate(combinedMessages);
            return sortedCombined;
          });
        } else {
          // Initial load: replace messages with the last 10 messages (newest)
          // Already sorted oldest->newest
          setMessages(sortedFetchedMessages);
          isInitialLoadRef.current = true;
        }

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
    setSenderInfoCache({}); // Clear cache
    isInitialLoadRef.current = true;
    fetchMessages(conversationId, 0, false);
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

    // When user reaches bottom of active conversation, emit seen.
    if (isAtBottomRef.current) {
      const conversationId = activeConversationIdRef.current;
      if (socket && socket.connected && conversationId) {
        socket.emit(SOCKET_EVENTS.MESSAGE_SEEN, { conversationId });
      }
    }

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
  }, [isLoadingMessages, loadOlderMessages, socket]);

  // Handle scroll position after messages update
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (isInitialLoadRef.current && messages.length > 0) {
      // Initial load - scroll to bottom to show newest messages
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
    } else if (previousScrollHeightRef.current > 0) {
      // Loading older messages - preserve scroll position precisely
      const newScrollHeight = container.scrollHeight;
      const scrollDifference = newScrollHeight - previousScrollHeightRef.current;
      const prevTop = previousScrollTopRef.current || 0;
      container.scrollTop = prevTop + scrollDifference;
      previousScrollHeightRef.current = 0; // Reset
      previousScrollTopRef.current = 0;
    }
  }, [messages.length, messagesOffset]);

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

  // Reset file upload state
  const resetFileUploadState = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  // Refresh conversations list
  const refreshContacts = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/user/conversations', {
        method: "GET",
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.conversations || []);
        return data.conversations || [];
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
    return [];
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
          seen: null,
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

  const uploadFile = useCallback(
    async (file, previewUrl) => {
      if (!file) return;

      if (!selectedChat) {
        alert('Please select a chat before uploading a file.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert('File size must be less than 5MB');
        return;
      }

      setFilePreview(previewUrl);
      setSelectedFile(file);
      setIsUploading(true);
      setUploadProgress(0);

      const reader = new FileReader();
      reader.onloadend = async () => {
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              return 100;
            }
            return prev + 10;
          });
        }, 200);

        try {
          const response = await fetch('/api/v1/chat/upload', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              chatId: selectedChat.id,
              file: reader.result.split(',').pop(),
            }),
          });

          if (!response.ok) {
            if (response.status === 413) {
              alert('File is too large.');
            } else {
              alert('Unable to upload the file right now.');
            }
          }
        } catch (error) {
          console.error('Upload failed:', error);
          alert('Something went wrong uploading your file.');
        } finally {
          clearInterval(interval);
          resetFileUploadState();
        }
      };

      reader.readAsDataURL(file);
    },
    [resetFileUploadState, selectedChat]
  );

  // Handle file upload
  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      await uploadFile(file, previewUrl);
      event.target.value = '';
    },
    [uploadFile]
  );

  const handleSendMedia = useCallback(
    async (media) => {
      if (!selectedChat) {
        alert('Please select a chat before sending media.');
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
        const previewUrl = URL.createObjectURL(blob);
        await uploadFile(file, previewUrl);
      } catch (error) {
        console.error('Failed to send media:', error);
        alert('Unable to send media right now.');
      } finally {
        setIsMediaPickerOpen(false);
      }
    },
    [selectedChat, uploadFile]
  );

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

        <div className={styles.chatList}>
          {contacts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Start a conversation...</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isPrivateChat = chat.type === "pv";
              const isMyMessage = chat.last_message.sender === user?.username;
              const selectedId = selectedChat?._id || selectedChat?.id;
              const chatId = chat._id || chat.id;
              const avatarSrc = isPrivateChat 
                ? chat.contact_info?.profile_pic 
                : chat.group_avatar;
              const displayName = isPrivateChat 
                ? chat.contact_info?.username 
                : chat.group_name;

              return (
                <div
                  key={chat._id || chat.id}
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
                        {truncateMessage(chat.last_message.content)}
                      </p>
                    </div>
                    <div className={styles.chatInfoFooter}>
                      <span className={styles.timestamp}>
                        {convertISOtoLocal(chat.last_message.when)}
                      </span>
                      {isPrivateChat && isMyMessage && (
                        <span className={styles.seenIcon}>
                          {chat.last_message.seen !== null && (
                          <img 
                              src={chat.last_message.seen ? seenIcon : sentIcon} 
                              alt={chat.last_message.seen ? "Seen" : "Sent"}
                              style={{ width: 16, height: 16 }} 
                            />
                          )}
                        </span>
                      )}
                      {(unreadCounts[chatId] || 0) > 0 && (
                        <span className={styles.notificationBadge}>
                          <p>{unreadCounts[chatId]}</p>
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

      <main className={styles.chatMain}>
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
              {isLoadingMessages && messages.length === 0 && (
                <div className={styles.loadingMessages}>
                  <p>Loading messages...</p>
                </div>
              )}
              {!isLoadingMessages && messages.length === 0 && (
                <div className={styles.emptyMessages}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              {isLoadingMessages && messages.length > 0 && (
                <div className={styles.loadingMore}>
                  <p>Loading older messages...</p>
                </div>
              )}
              <div className={styles.messagesWrapper}>
                {messages.map((message, index) => {
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
                  
                  // Debug logging for first message - inspect actual message structure
                  if (index === 0 && messages.length > 0) {
                    console.log('Full message object:', message);
                    console.log('Message detection debug:', {
                      messageSenderId,
                      currentUserId,
                      username,
                      isMyMessage,
                      messageKeys: Object.keys(message),
                      message: {
                        sender: message.sender,
                        sender_id: message.sender_id,
                        sender_username: message.sender_username,
                        sender_name: message.sender_name,
                        sender_info: message.sender_info,
                        user_id: message.user_id,
                      },
                      user: {
                        id: user?.id,
                        username: user?.username,
                      }
                    });
                  }
                  
                  const messageId = message._id || message.id || `msg-${index}`;
                  const messageContent = message.content || message.text || '';
                  const messageTime = message.when || message.timestamp || message.created_at;
                  const isPrivateChat = selectedChat?.type === 'pv';
                  const isGroupChat = selectedChat?.type === 'group';
                  const replyPreview = message.reply_to || message.replyTo || message.reply_to_message;
                  const isEmojiOnly = isEmojiOnlyMessage(messageContent);
                  const shouldUseEmojiOnlyStyle = isEmojiOnly && !replyPreview && !(message.type === 'file' && message.file_url);
                  const replyPreviewText = truncateMessage(
                    replyPreview?.content || replyPreview?.text || '',
                    80
                  );
                  
                  // Get sender info for group messages (received only)
                  const senderIdStr = messageSenderId;
                  const senderInfo = !isMyMessage && isGroupChat ? senderInfoCache[senderIdStr] : null;
                  
                  // Check seen status - API may provide 'seen' boolean or 'seen_by' object
                  // For sent messages, check if recipient has seen it
                  let messageSeen = null;
                  if (message.seen !== undefined && message.seen !== null) {
                    messageSeen = message.seen;
                  } else if (message.seen_by && typeof message.seen_by === 'object') {
                    // If seen_by is an object, check if it has any entries (someone has seen it)
                    const seenByKeys = Object.keys(message.seen_by);
                    messageSeen = seenByKeys.length > 0;
                  }
                  
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
                        animatedMessageIdsRef.current.has(messageId) ? styles.messageEnter : ''
                      }`}
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
                      {!isMyMessage && isGroupChat && senderInfo && (
                        <div className={styles.messageAvatar}>
                          <ProfileAvatar 
                            src={senderInfo.profile_pic} 
                            size={36}
                            alt={senderInfo.username}
                            borderWidth={0}
                          />
                        </div>
                      )}
                      
                      <div
                        className={`${styles.message} ${isMyMessage ? styles.sent : styles.received} ${
                          shouldUseEmojiOnlyStyle ? styles.emojiOnly : ''
                        }`}
                        data-message-type={isMyMessage ? 'sent' : 'received'}
                      >
                        {replyPreview && (
                          <div className={styles.replyPreview}>
                            <div className={styles.replyPreviewLine} />
                            <div className={styles.replyPreviewContent}>
                              <p className={styles.replyPreviewText}>
                                {replyPreviewText}
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Username inside message bubble for group chats */}
                        {!isMyMessage && isGroupChat && senderInfo && (
                          <div className={styles.messageSenderName}>
                            <span className={styles.senderUsername}>{senderInfo.username}</span>
                          </div>
                        )}
                        
                        {message.type === 'file' && message.file_url && (
                          <img 
                            src={message.file_url} 
                            alt="File attachment" 
                            className={styles.messageImage}
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
                              {messageSeen !== null && messageSeen !== undefined ? (
                                <img 
                                  src={messageSeen ? seenIcon : sentIcon} 
                                  alt={messageSeen ? "Seen" : "Sent"}
                                  className={styles.seenIconImage}
                                />
                              ) : (
                                <img 
                                  src={sentIcon} 
                                  alt="Sent"
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
                  {filePreview && (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className={styles.filePreview}
                    />
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
                accept="image/*"
                title="Maximum file size is 5MB"
              />
              <div className={styles.composer}>
                {replyingToMessage && (
                  <div className={styles.replyBar}>
                    <div className={styles.replyBarContent}>
                      <p className={styles.replyBarTitle}>Replying to</p>
                      <p className={styles.replyBarText}>
                        {truncateMessage(
                          replyingToMessage?.content || replyingToMessage?.text || '',
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
