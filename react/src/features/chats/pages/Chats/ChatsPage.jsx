import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faPaperPlane,
  faEllipsisVertical,
  faTimes,
  faAddressBook,
} from '@fortawesome/free-solid-svg-icons';
import { faFile, faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import { Sidebar, Input, Button, ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import sentIcon from "@/shared/assets/icons/sent.svg";
import seenIcon from "@/shared/assets/icons/seen.svg";
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
  const [randomIcon, setRandomIcon] = useState(null);
  
  // Messages state
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const messagesContainerRef = useRef(null);
  const isLoadingMoreRef = useRef(false);

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

  // Store previous scroll height for position preservation
  const previousScrollHeightRef = useRef(0);

  // Fetch messages function
  const fetchMessages = useCallback(async (conversationId, offset = 0, append = false) => {
    if (!conversationId || isLoadingMoreRef.current) return;

    setIsLoadingMessages(true);
    isLoadingMoreRef.current = true;

    // Store scroll position before loading older messages
    const container = messagesContainerRef.current;
    if (container && append) {
      previousScrollHeightRef.current = container.scrollHeight;
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
        
        if (append) {
          // Prepend older messages to the beginning
          setMessages((prevMessages) => [...fetchedMessages, ...prevMessages]);
        } else {
          // Replace messages (initial load)
          setMessages(fetchedMessages);
        }

        // Check if there are more messages to load
        setHasMoreMessages(fetchedMessages.length === limit);
        setMessagesOffset(offset + fetchedMessages.length);
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

  // Fetch messages when selectedChat changes
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      setMessagesOffset(0);
      setHasMoreMessages(true);
      return;
    }

    const conversationId = selectedChat._id || selectedChat.id;
    if (!conversationId) return;

    // Reset state and fetch initial messages
    setMessages([]);
    setMessagesOffset(0);
    setHasMoreMessages(true);
    fetchMessages(conversationId, 0, false);
  }, [selectedChat, fetchMessages]);

  // Handle scroll for lazy loading
  const handleScroll = useCallback((e) => {
    const container = e.target;
    // Check if scrolled to top (with 100px threshold)
    if (container.scrollTop <= 100 && hasMoreMessages && !isLoadingMessages && !isLoadingMoreRef.current) {
      const conversationId = selectedChat?._id || selectedChat?.id;
      if (conversationId) {
        fetchMessages(conversationId, messagesOffset, true);
      }
    }
  }, [selectedChat, hasMoreMessages, isLoadingMessages, messagesOffset, fetchMessages]);

  // Handle scroll position after messages update
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (messagesOffset <= MESSAGES_LIMIT && messages.length > 0) {
      // Initial load - scroll to bottom
      container.scrollTop = container.scrollHeight;
    } else if (previousScrollHeightRef.current > 0) {
      // Loading older messages - preserve scroll position
      const newScrollHeight = container.scrollHeight;
      const scrollDifference = newScrollHeight - previousScrollHeightRef.current;
      container.scrollTop = container.scrollTop + scrollDifference;
      previousScrollHeightRef.current = 0; // Reset
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
                  key={chat._id}
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
                  
                  // Debug logging for first message (remove in production)
                  if (index === 0 && messages.length > 0) {
                    console.log('Message detection debug:', {
                      messageSenderId,
                      currentUserId,
                      username,
                      isMyMessage,
                      message: {
                        sender: message.sender,
                        sender_id: message.sender_id,
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
                      className={`${styles.message} ${isMyMessage ? styles.sent : styles.received}`}
                      data-message-type={isMyMessage ? 'sent' : 'received'}
                    >
                      {message.type === 'file' && message.file_url && (
                        <img 
                          src={message.file_url} 
                          alt="File attachment" 
                          className={styles.messageImage}
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
                  );
                })}
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
              <label className={styles.fileUploadIcon} htmlFor="file-upload">
                <FontAwesomeIcon icon={faFile} />
              </label>
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
              <Button type="button">
                <FontAwesomeIcon icon={faPaperPlane} />
              </Button>
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