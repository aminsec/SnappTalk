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
} from '@fortawesome/free-solid-svg-icons';
import { faFile, faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import { Sidebar, Input, Button, ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import toast from 'react-hot-toast';
import { socket } from '@/shared/utils/socket';
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

function ChatsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [randomIcon, setRandomIcon] = useState(null);
  const optionsMenuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const animatedMessageIdsRef = useRef(new Set());
  
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

    const conversationId = selectedChat._id || selectedChat.id;
    if (!conversationId) {
      toast.error('Invalid conversation.');
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
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
    };

    animatedMessageIdsRef.current.add(optimisticId);

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');
    shouldAutoScrollRef.current = true;

    try {
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('message', {
        conversationId,
        type: 'text',
        content,
        clientId: optimisticId,
      });
    } catch (err) {
      console.error('Failed to emit socket message:', err);
      toast.error('Unable to send message right now.');
    }
  }, [messageInput, scrollToBottom, selectedChat, user?.id]);
  
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

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log('Socket connected:', socket.id);
    };

    const handleDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
    };

    const handleIncomingMessage = (data) => {
      const payload = data ?? {};
      const activeChat = selectedChatRef.current;
      const activeConversationId = activeChat?._id || activeChat?.id;

      const incomingConversationId = payload.conversationId || payload.conversation_id;
      const message = payload.message || payload;
      const messageConversationId = incomingConversationId || message?.conversation_id;

      const messageId = message?._id || message?.id;
      if (!messageId) {
        return;
      }

      setContacts((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => (c._id || c.id) === messageConversationId);
        if (idx === -1) return prev;

        const chat = next[idx];
        const senderName = payload.senderUsername || payload.sender || chat?.last_message?.sender || '';
        const when = message?.created_at || payload.when || new Date().toISOString();

        next[idx] = {
          ...chat,
          last_message: {
            content: message?.content ?? payload.content ?? '',
            type: message?.type ?? payload.type ?? 'text',
            sender: senderName,
            when,
            seen: chat?.last_message?.seen ?? null,
          },
        };

        // Move updated conversation to top
        const [moved] = next.splice(idx, 1);
        next.unshift(moved);
        return next;
      });

      if (activeConversationId && messageConversationId && activeConversationId === messageConversationId) {
        animatedMessageIdsRef.current.add(messageId);
        setMessages((prev) => {
          const exists = prev.some((m) => (m._id || m.id) === messageId);
          if (exists) return prev;
          return [...prev, message];
        });
        if (isNearBottomRef.current) {
          shouldAutoScrollRef.current = true;
        }
      } else {
        toast.success('New message');
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message', handleIncomingMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message', handleIncomingMessage);
    };
  }, [scrollToBottom, user]);

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

  // Handle file upload
  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!selectedChat) {
        alert('Please select a chat before uploading a file.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert('File size must be less than 5MB');
        event.target.value = '';
        return;
      }

      const previewUrl = URL.createObjectURL(file);
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
                      {isPrivateChat && !isMyMessage && !chat.last_message.seen && (
                        <span className={styles.notificationBadge}>
                          <p>1</p>
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
              <FontAwesomeIcon icon={faEllipsisVertical} size={24} />
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
                        className={`${styles.message} ${isMyMessage ? styles.sent : styles.received}`}
                        data-message-type={isMyMessage ? 'sent' : 'received'}
                      >
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
              <Input
                placeholder="Type a message..."
                value={messageInput}
                fullWidth
                onChange={(e) => setMessageInput(e.target.value)}
                className={styles.messageInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                type="button"
                className={styles.emojiButton}
                onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
              >
                <FontAwesomeIcon icon={faFaceSmile} />
                <EmojiPicker
                  className={styles.emojiPicker}
                  open={isEmojiPickerOpen}
                  theme="auto"
                  onEmojiClick={(emojiData) => {
                    setMessageInput((prev) => prev + emojiData.emoji);
                  }}
                />
              </button>
              <button type="button" className={styles.sendButton} onClick={handleSendMessage}>
                <img src={sendIcon} alt="Send" className={styles.sendIcon} />
              </button>
            </div>
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