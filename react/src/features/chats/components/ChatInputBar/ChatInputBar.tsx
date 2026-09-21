import React from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperclip,
  faImage,
  faFile as faFileSolid,
  faCompactDisc,
  faLocationDot,
  faXmark,
  faCheck,
  faStop,
  faMicrophone,
} from '@fortawesome/free-solid-svg-icons';
import { faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import sendIcon from '@/shared/assets/icons/sendIcon.svg';
import {
  formatDuration,
  truncateMessage,
  getMessagePreviewText,
  getSenderId,
  MAX_MESSAGE_LENGTH,
} from '../../utils/chatHelpers';
import styles from '../../pages/Chats/Chat.module.css';

export interface ChatInputBarProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Attachment menu
  isOptionsMenuOpen: boolean;
  optionsMenuRef: React.RefObject<HTMLDivElement | null>;
  onOptionsMenuToggle: () => void;
  onUploadMediaClick: () => void;
  onUploadFileClick: () => void;
  onUploadMusicClick: () => void;
  onSendLocationClick: () => void;
  // Reply bar
  replyingToMessage: any;
  onCancelReply: () => void;
  user: any;
  selectedChat: any;
  // Text area & editing
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  editingMessage: any;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onSendMessage: () => void;
  maxLength?: number;
  // Media picker (Emoji & GIFs)
  isMediaPickerOpen: boolean;
  mediaPickerRef: React.RefObject<HTMLDivElement | null>;
  onToggleMediaPicker: () => void;
  mediaTab: 'emoji' | 'gifs' | string;
  onTabChange: (tab: any) => void;
  gifQuery: string;
  onGifQueryChange: (query: string) => void;
  giphyError: string | null;
  isGiphyLoading: boolean;
  activeMediaItems: any[];
  onSendMedia: (item: any) => void;
  onEmojiClick: (emoji: string) => void;
  // Voice recorder
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onFileChange,
  isOptionsMenuOpen,
  optionsMenuRef,
  onOptionsMenuToggle,
  onUploadMediaClick,
  onUploadFileClick,
  onUploadMusicClick,
  onSendLocationClick,
  replyingToMessage,
  onCancelReply,
  user,
  selectedChat,
  messageInput,
  onMessageInputChange,
  editingMessage,
  onEditSubmit,
  onEditCancel,
  onSendMessage,
  maxLength = MAX_MESSAGE_LENGTH,
  isMediaPickerOpen,
  mediaPickerRef,
  onToggleMediaPicker,
  mediaTab,
  onTabChange,
  gifQuery,
  onGifQueryChange,
  giphyError,
  isGiphyLoading,
  activeMediaItems,
  onSendMedia,
  onEmojiClick,
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
}) => {
  return (
    <div className={styles.inputBar}>
      <input
        id="media-upload"
        type="file"
        multiple
        accept="image/*,video/*"
        hidden
        onChange={onFileChange}
        title="Maximum file size is 20 MB"
      />
      <input
        id="file-upload"
        type="file"
        multiple
        hidden
        onChange={onFileChange}
        title="Maximum file size is 20 MB"
      />
      <input
        id="audio-upload"
        type="file"
        multiple
        accept="audio/*,.aac,.flac,.m4a,.mp3,.ogg,.opus,.wav,.weba,.wma"
        hidden
        onChange={onFileChange}
        title="Maximum file size is 20 MB"
      />

      {/* Left Actions */}
      <div className={styles.inputActionsLeft}>
        <div className={styles.optionsMenuContainer} ref={optionsMenuRef}>
          <button
            type="button"
            className={`${styles.actionButton} ${isOptionsMenuOpen ? styles.attachmentButtonActive : ''}`}
            onClick={onOptionsMenuToggle}
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
                onClick={onUploadMediaClick}
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
                onClick={onUploadFileClick}
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
                onClick={onUploadMusicClick}
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
                onClick={onSendLocationClick}
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
                {truncateMessage(getMessagePreviewText(replyingToMessage), 80)}
              </p>
            </div>
            <button
              type="button"
              className={styles.replyBarClose}
              onClick={onCancelReply}
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
          maxLength={maxLength}
          onChange={(e) => onMessageInputChange(e.target.value)}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (editingMessage) {
                if (messageInput.trim().length <= maxLength) {
                  onEditSubmit();
                }
              } else {
                if (messageInput.trim().length <= maxLength) {
                  onSendMessage();
                }
              }
            }
            if (e.key === 'Escape' && editingMessage) {
              e.preventDefault();
              onEditCancel();
            }
          }}
        />
        {messageInput.length >= 200 && (
          <span className={styles.charWarning}>
            {messageInput.length}/{maxLength}
          </span>
        )}
      </div>

      {/* Right Actions */}
      <div className={styles.inputActionsRight}>
        {/* Emoji Button */}
        <div className={styles.mediaPickerWrapper} ref={mediaPickerRef}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={onToggleMediaPicker}
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
                  onClick={() => onTabChange('emoji')}
                >
                  Emoji
                </button>
                <button
                  type="button"
                  className={`${styles.mediaTab} ${mediaTab === 'gifs' ? styles.mediaTabActive : ''}`}
                  onClick={() => onTabChange('gifs')}
                >
                  GIFs
                </button>
              </div>
              {mediaTab === 'emoji' && (
                <div className={styles.emojiPane}>
                  <EmojiPicker
                    className={styles.emojiPicker}
                    open
                    theme={Theme.AUTO}
                    onEmojiClick={(emojiData) => {
                      onEmojiClick(emojiData.emoji);
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
                        onChange={(event) => onGifQueryChange(event.target.value)}
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
                        onClick={() => onSendMedia(item)}
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
              onClick={onEditCancel}
              aria-label="Cancel edit"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.editSaveButton}`}
              onClick={onEditSubmit}
              aria-label="Save edit"
              disabled={messageInput.trim().length > maxLength}
            >
              <FontAwesomeIcon icon={faCheck} />
            </button>
          </>
        )}

        {/* Record/Send Button */}
        {!editingMessage && (
          <div className={styles.sendButtonWrapper}>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.primaryButton} ${isRecording ? styles.recordingActive : ''} ${messageInput.trim() ? styles.hasText : ''}`}
              onClick={isRecording ? onStopRecording : (messageInput.trim() ? onSendMessage : onStartRecording)}
              disabled={!isRecording && messageInput.trim().length > maxLength}
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
  );
};

export default ChatInputBar;
