import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';

import styles from './GeneralSection.module.css';

function MainSection() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/v1/user/info/delete-account', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Unable to delete account right now.');
      }

      window.location.href = '/login';
    } catch (error) {
      toast.error(error?.message || 'Unable to delete account right now.');
    } finally {
      setIsDeleting(false);
    }
  };

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
                  handleDeleteAccount();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainSection;
