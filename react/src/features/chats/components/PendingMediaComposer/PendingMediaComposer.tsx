import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faMusic,
  faFileLines,
  faTrash,
  faVideo,
  faPlus,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { PendingMediaItem } from '../../types/chatPage.types';
import {
  formatFileSize,
  getMessageFileName,
  MAX_MEDIA_BATCH,
  MAX_MESSAGE_LENGTH,
} from '../../utils/chatHelpers';
import styles from '../../pages/Chats/Chat.module.css';

export interface PendingMediaComposerProps {
  items: PendingMediaItem[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
  onSend: () => void;
  onClose: () => void;
  onAddMore: () => void;
  maxBatch?: number;
  maxLength?: number;
}

export const PendingMediaComposer: React.FC<PendingMediaComposerProps> = ({
  items,
  selectedId,
  onSelectId,
  onRemove,
  onUpdateCaption,
  onSend,
  onClose,
  onAddMore,
  maxBatch = MAX_MEDIA_BATCH,
  maxLength = MAX_MESSAGE_LENGTH,
}) => {
  if (items.length === 0) return null;

  const selectedItem = items.find((item) => item.id === selectedId) || items[0];
  if (!selectedItem) return null;

  return (
    <div
      className={styles.mediaUploadBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-upload-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.mediaUploadDialog}>
        <header className={styles.mediaUploadHeader}>
          <div>
            <h2 id="media-upload-title">Send media</h2>
            <p>{items.length} of {maxBatch} selected · 20 MB maximum each</p>
          </div>
          <button
            type="button"
            className={styles.mediaUploadClose}
            onClick={onClose}
            aria-label="Close media preview"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className={styles.mediaUploadPreview}>
          {selectedItem.type === 'image' && (
            <>
              <img
                className={styles.mediaUploadBlurMedia}
                src={selectedItem.previewUrl}
                alt=""
                aria-hidden="true"
              />
              <img src={selectedItem.previewUrl} alt={selectedItem.file.name} />
            </>
          )}
          {selectedItem.type === 'video' && (
            <>
              <video
                className={styles.mediaUploadBlurMedia}
                src={selectedItem.previewUrl}
                muted
                playsInline
                aria-hidden="true"
              />
              <video src={selectedItem.previewUrl} controls preload="metadata" />
            </>
          )}
          {(selectedItem.type === 'voice' || selectedItem.type === 'file') && (
            <div className={styles.mediaFilePreview}>
              <span className={styles.mediaFilePreviewIcon}>
                <FontAwesomeIcon
                  icon={selectedItem.type === 'voice' ? faMusic : faFileLines}
                />
              </span>
              <strong>{selectedItem.file.name}</strong>
              <span>{formatFileSize(selectedItem.file.size)}</span>
            </div>
          )}
          <button
            type="button"
            className={styles.mediaPreviewRemove}
            onClick={() => onRemove(selectedItem.id)}
            aria-label={`Remove ${selectedItem.file.name}`}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>

        <div className={styles.mediaThumbnailRail} aria-label="Selected files">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.mediaThumbnail} ${
                item.id === selectedItem.id ? styles.mediaThumbnailActive : ''
              }`}
              onClick={() => onSelectId(item.id)}
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
          {items.length < maxBatch && (
            <button
              type="button"
              className={`${styles.mediaThumbnail} ${styles.mediaThumbnailAdd}`}
              onClick={onAddMore}
              aria-label="Add more files"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          )}
        </div>

        <div className={styles.mediaUploadComposer}>
          <div className={styles.mediaCaptionField}>
            <textarea
              value={selectedItem.caption || ''}
              onChange={(event) =>
                onUpdateCaption(selectedItem.id, event.target.value.slice(0, maxLength))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              rows={1}
              placeholder={
                items.length > 1
                  ? `Add a caption to ${getMessageFileName(selectedItem.file) || 'this file'}...`
                  : 'Add a caption...'
              }
              aria-label={`Caption for ${getMessageFileName(selectedItem.file) || 'selected media'}`}
            />
            <span>{(selectedItem.caption || '').length}/{maxLength}</span>
          </div>
          <button
            type="button"
            className={styles.mediaSendButton}
            onClick={onSend}
            aria-label={`Send ${items.length} selected ${items.length === 1 ? 'file' : 'files'}`}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PendingMediaComposer;

