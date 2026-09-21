import React from 'react';
import styles from '../../pages/Chats/Chat.module.css';

export interface DeleteConversationModalProps {
  isOpen: boolean;
  targetName?: string | null;
  deleteForEveryone: boolean;
  onToggleDeleteForEveryone: (checked: boolean) => void;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConversationModal: React.FC<DeleteConversationModalProps> = ({
  isOpen,
  targetName,
  deleteForEveryone,
  onToggleDeleteForEveryone,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
      <div className={styles.confirmBox}>
        <p className={styles.confirmTitle}>Delete conversation?</p>
        <p className={styles.confirmText}>
          Choose whether to delete just for you or for everyone.
        </p>
        <div className={styles.confirmActions}>
          <label className={styles.deleteCheckbox}>
            <input
              type="checkbox"
              checked={deleteForEveryone}
              onChange={(event) => onToggleDeleteForEveryone(event.target.checked)}
              disabled={isDeleting}
            />
            <span>
              {targetName ? `Delete for ${targetName}` : 'Delete for contact'}
            </span>
          </label>
          <div className={styles.confirmButtons}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmButton}
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface DeleteLastMessageAlertModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteLastMessageAlertModal: React.FC<DeleteLastMessageAlertModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
      <div className={styles.confirmBox}>
        <p className={styles.confirmTitle}>Attention</p>
        <p className={styles.confirmText}>
          By deleting this message the conversation will be gone
        </p>
        <div className={styles.confirmButtons}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export interface DeleteMessageModalProps {
  isOpen: boolean;
  deleteForEveryone: boolean;
  onToggleDeleteForEveryone: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  isOpen,
  deleteForEveryone,
  onToggleDeleteForEveryone,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
      <div className={styles.confirmBox}>
        <p className={styles.confirmTitle}>Delete message?</p>
        <p className={styles.confirmText}>
          Choose whether to delete this message just for you or for everyone.
        </p>
        <div className={styles.confirmActions}>
          <label className={styles.deleteCheckbox}>
            <input
              type="checkbox"
              checked={deleteForEveryone}
              onChange={(event) => onToggleDeleteForEveryone(event.target.checked)}
            />
            <span>Delete for everyone</span>
          </label>
          <div className={styles.confirmButtons}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmButton}
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

