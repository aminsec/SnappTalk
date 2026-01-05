import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';

import styles from './GeneralSection.module.css';

function MainSection() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className={styles.generalContainer}>
      <div className={styles.sectionHeader}>
        <h2>General</h2>
        <p>Manage your account settings and preferences.</p>
      </div>

      <div className={styles.dangerZone}>
        <div className={styles.dangerCopy}>
          <h4>Delete account</h4>
          <p>This will permanently remove your account and conversations.</p>
        </div>
        <Button
          size="sm"
          variant="danger"
          onClick={() => setShowDeleteConfirm(true)}
          className={styles.deleteBtn}
          aria-label="Delete account"
        >
          Delete account
        </Button>
      </div>

      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
          <div className={styles.confirmBox}>
            <h4 className={styles.confirmTitle}>Delete account</h4>
            <p className={styles.confirmText}>
              Are you sure you want to delete your account? This cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  toast.error('Delete account is not available yet.');
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainSection;
