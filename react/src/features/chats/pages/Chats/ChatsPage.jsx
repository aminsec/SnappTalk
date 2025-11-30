import { useCallback, useEffect, useMemo, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faPaperPlane,
  faEllipsisVertical,
  faTimes,
  faCheck,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { faFile, faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import { Sidebar, Input, Button, ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import defaultAvatar from '@/shared/assets/images/avatar.png';
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

// Fake chat data used for the static UI
const FAKE_CHATS = Array(3)
  .fill(null)
  .map((_, i) => ({
    id: i + 1,
    username: `User ${i + 1}`,
    avatar: defaultAvatar,
    notificationCount: Math.floor(Math.random() * 5),
    lastMessage: (() => {
      const date = new Date(Date.now() - Math.random() * 10000000);
      return {
        text: `Last message from chat ${i + 1}...`,
        seen: Math.random() > 0.5,
        timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        _fullTimestamp: date,
      };
    })(),
    messages: Array(30)
      .fill(null)
      .map((__, j) => {
        const date = new Date(Date.now() - Math.random() * 10000000);
        return {
          id: j,
          sender: Math.random() > 0.5 ? 'me' : 'them',
          text: `This is message ${j + 1} in chat ${i + 1}`,
          timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          _fullTimestamp: date,
        };
      }),
  }));

function convertISOtoLocal(isoDate){
  const date = new Date(isoDate);

  const formatted = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return formatted;
};

function ChatsPage() {
  const { user, status, refreshUser } = useAuth();
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

  useEffect(() => {
    const getContacts = async () => {
      const request = await fetch('/api/v1/user/contacts', {
        method: "GET",
        credentials: "include"
      });

      if(request.ok){
        const response = await request.json();
        setContacts(response.contacts)
      }
    }

    getContacts()
  }, [])

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * monoIcons.length);
    setRandomIcon(monoIcons[randomIndex]);
  }, [])

  const filteredChats = useMemo(
    () => {
      if (!searchQuery.trim()) return contacts;
      
      const query = searchQuery.toLowerCase();
      return contacts.filter((chat) => {
        if (chat.type === "pv") {
          return chat.contact_info?.username?.toLowerCase().includes(query);
        } else {
          return chat.group_name?.toLowerCase().includes(query);
        }
      });
    },
    [searchQuery, contacts]
  );

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  const resetFileUploadState = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  const handleCancelUpload = useCallback(() => {
    resetFileUploadState();
  }, [resetFileUploadState]);

  const handleNewConversation = useCallback(() => {
    setIsNewConversationModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsNewConversationModalOpen(false);
  }, []);

  const handleSelectUser = useCallback(async (selectedUser) => {
    try {
      // Create a new conversation with the selected user
      const response = await fetch('/api/v1/chat/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser._id || selectedUser.id,
          type: 'pv', // Private conversation
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh contacts list
        const contactsResponse = await fetch('/api/v1/user/contacts', {
          method: "GET",
          credentials: "include"
        });
        
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          setContacts(contactsData.contacts);
          
          // Select the newly created conversation
          const newChat = contactsData.contacts.find(
            (chat) => chat.type === 'pv' && 
            (chat.contact_info?._id === selectedUser._id || chat.contact_info?.id === selectedUser.id)
          );
          if (newChat) {
            setSelectedChat(newChat);
          }
        }
      } else {
        console.error('Failed to create conversation');
        alert('Failed to create conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Something went wrong. Please try again.');
    }
  }, []);

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!selectedChat) {
        alert('Please select a chat before uploading a file.');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
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
          console.error('Upload failed', error);
          alert('Something went wrong uploading your file.');
        } finally {
          resetFileUploadState();
        }
      };

      reader.readAsDataURL(file);
    },
    [resetFileUploadState, selectedChat]
  );

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

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
            filteredChats.map((chat) => (
              <div
                key={chat._id}
                className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.active : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <ProfileAvatar size="md" src={chat.type === "pv" ? chat.contact_info.profile_pic : chat.group_avatar} />
                <div className={styles.chatInfo}>
                  <div className={styles.chatInfoHeader}>
                    <h3>{chat.type === "pv" ? chat.contact_info.username : chat.group_name}</h3>
                    <p className={styles.lastMessage}>
                      {chat.type === "group" && chat.last_message.sender !== user.username && 
                        <b>{chat.last_message.sender}: </b>
                      }
                      {chat.type === "group" && chat.last_message.sender === user.username && 
                        <span className={styles.youText}>You: </span>
                      }
                      {chat.last_message.content.length > 25 ? chat.last_message.content.substring(0, 25) + "..." : chat.last_message.content}
                    </p>
                  </div>
                  <div className={styles.chatInfoFooter}>
                    <span className={styles.timestamp}>{convertISOtoLocal(chat.last_message.when)}</span>
                    {chat.type === "pv" &&
                      chat.last_message.sender === user.username &&
                      chat.last_message.seen === true && (
                        <span className={styles.seenIcon}>
                          <img src={seenIcon} style={{ width: 16, height: 16 }} />
                        </span>
                    )}

                    {chat.type === "pv" &&
                      chat.last_message.sender === user.username &&
                      chat.last_message.seen === false && (
                        <span className={styles.seenIcon}>
                          <img src={sentIcon} style={{ width: 16, height: 16 }} />
                        </span>
                    )}

                    {chat.type === "pv" &&
                      chat.last_message.sender !== user.username &&
                      !chat.last_message.seen === false && (
                        <span className={styles.notificationBadge}>
                          <p>{1}</p>
                        </span>
                    )}

                    
                  </div>
                </div>
              </div>
            ))
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
                <ProfileAvatar size="md" alt={selectedChat.contact_info.username} src={selectedChat.contact_info.avatar} />
                <div>
                  <h2>{selectedChat.contact_info.username}</h2>
                  <p className={styles.onlineStatus}>Online</p>
                </div>
              </div>

              <FontAwesomeIcon icon={faEllipsisVertical} size={24} />
            </div>

            <div className={styles.messagesContainer}>
              <div className={styles.messagesWrapper}>
                {selectedChat.messages.map((message) => (
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
                  <Button className={styles.cancelUpload} onClick={handleCancelUpload}>
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
                <FontAwesomeIcon icon={faFile} className={styles.fileUploadIcon} />
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
