import { useCallback, useEffect, useMemo, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faPaperPlane,
  faCheckDouble,
  faEllipsisVertical,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { faFile, faFaceSmile } from '@fortawesome/free-regular-svg-icons';

import { Sidebar, Input, Button, ProfileAvatar } from '@/shared/components';
import defaultAvatar from '@/shared/assets/images/avatar.png';

import styles from './Chat.module.css';

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

function ChatsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const filteredChats = useMemo(
    () => FAKE_CHATS.filter((chat) => chat.username.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
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

  const handleSendMessage = useCallback(async () => {
    if (!selectedChat || !messageInput.trim()) {
      return;
    }

    // TODO: Implement actual message sending API call
    // For now, just clear the input
    setMessageInput('');
    setIsEmojiPickerOpen(false);
  }, [selectedChat, messageInput]);

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
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.active : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <ProfileAvatar size="md" alt={chat.username} src={chat.avatar} />
              <div className={styles.chatInfo}>
                <div className={styles.chatInfoHeader}>
                  <h3>{chat.username}</h3>
                  <p className={styles.lastMessage}>{chat.lastMessage.text}</p>
                </div>
                <div className={styles.chatInfoFooter}>
                  <span className={styles.timestamp}>{chat.lastMessage.timestamp}</span>
                  {chat.lastMessage.seen ? (
                    <span className={styles.seenIcon}>
                      <FontAwesomeIcon icon={faCheckDouble} />
                    </span>
                  ) : (
                    <span className={styles.notificationBadge}>
                      <p>{chat.notificationCount}</p>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className={styles.chatMain}>
        {selectedChat ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.UserStatus}>
                <ProfileAvatar size="md" alt={selectedChat.username} src={selectedChat.avatar} />
                <div>
                  <h2>{selectedChat.username}</h2>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
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
              <Button type="button" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.noChatSelected}>
            <h2>Select a chat to start messaging</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default ChatsPage;
