import React from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ViewerMedia } from '../../types/chatPage.types';
import { getMessageFileName } from '../../utils/chatHelpers';
import styles from '../../pages/Chats/Chat.module.css';

export interface MediaViewerModalProps {
  media: ViewerMedia | null;
  onClose: () => void;
  onDownload: (message: any) => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  media,
  onClose,
  onDownload,
}) => {
  if (!media) return null;

  const title =
    getMessageFileName(media.message)
    || (media.type === 'gif' ? 'GIF' : media.type === 'video' ? 'Video' : 'Photo');

  return createPortal(
    <div
      className={styles.mediaViewerBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.mediaViewerToolbar}>
        <span>{title}</span>
        <div>
          <button
            type="button"
            onClick={() => onDownload(media.message)}
            aria-label="Download media"
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
          <button type="button" onClick={onClose} aria-label="Close media viewer">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      </div>
      {media.type === 'video' ? (
        <video
          src={media.url}
          controls
          autoPlay
          playsInline
          className={styles.mediaViewerVideo}
        />
      ) : (
        <img src={media.url} alt={title || 'Shared media'} />
      )}
    </div>,
    document.body
  );
};

export default MediaViewerModal;

