import { useCallback, useEffect, useMemo, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faPaperPlane,
  faEllipsisVertical,
  faTimes,
  faPlus,
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

// Helper functions
const convertISOtoLocal = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

  // Fetch contacts on mount
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/v1/user/contacts', {
          method: "GET",
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setContacts(data.contacts || []);
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
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

  // Refresh contacts list
  const refreshContacts = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/user/contacts', {
        method: "GET",
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        return data.contacts || [];
      }
    } catch (error) {
      console.error('Failed to refresh contacts:', error);
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
  const handleSelectUser = useCallback(async (selectedUser) => {
    try {
      const response = await fetch('/api/v1/chat/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser._id || selectedUser.id,
          type: 'pv',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      // Refresh contacts and select the new chat
      const updatedContacts = await refreshContacts();
      const newChat = updatedContacts.find(
        (chat) => chat.type === 'pv' && 
        (chat.contact_info?._id === selectedUser._id || chat.contact_info?.id === selectedUser.id)
      );
      
      if (newChat) {
        setSelectedChat(newChat);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation. Please try again.');
    }
  }, [refreshContacts]);

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
              const avatarSrc = isPrivateChat 
                ? chat.contact_info?.profile_pic 
                : chat.group_avatar;
              const displayName = isPrivateChat 
                ? chat.contact_info?.username 
                : chat.group_name;

              return (
                <div
                  key={chat._id}
                  className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.active : ''}`}
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
                          <img 
                            src={chat.last_message.seen ? seenIcon : sentIcon} 
                            alt={chat.last_message.seen ? "Seen" : "Sent"}
                            style={{ width: 16, height: 16 }} 
                          />
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
          <FontAwesomeIcon icon={faPlus} />
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

            <div className={styles.messagesContainer}>
              <div className={styles.messagesWrapper}>
                {selectedChat.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.message} ${message.sender === 'me' ? styles.sent : styles.received}`}
                  >
                    <p>{message.text}</p>
                    <span className={styles.timestamp}>{message.timestamp}</span>
                  </div>
                ))}
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
              <p className={styles.emptyChatSubtitle}>Pick a conversation to start texting</p>
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
