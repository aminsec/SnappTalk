import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';

import styles from './AccountSection.module.css';

function AccountSection() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Password update state
  const [passwordValues, setPasswordValues] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = (field) => (event) => {
    const { value } = event.target;
    setPasswordValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    const { old_password, new_password, confirm_password } = passwordValues;

    if (!old_password) {
      toast.error('Please enter your current password.');
      return;
    }

    if (!new_password) {
      toast.error('Please enter a new password.');
      return;
    }

    if (new_password.length < 6 || new_password.length > 24) {
      toast.error('New password must be 6–24 characters long.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
    if (!passwordRegex.test(new_password)) {
      toast.error('Password must contain uppercase, lowercase, digit, and special character.');
      return;
    }

    if (new_password !== confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/v1/user/info/password', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ old_password, new_password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update password.');
      }

      toast.success('Password updated successfully!');
      setPasswordValues({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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
        <span className={styles.eyebrow}>Security and ownership</span>
        <h2>Account</h2>
        <p>Manage sensitive actions connected to your SnappTalk account.</p>
      </div>

      <div className={styles.cardSection}>
        <div className={styles.cardHeader}>
          <h4>Change password</h4>
          <p>Keep your account secure with a strong, unique password.</p>
        </div>

        <form className={styles.passwordForm} onSubmit={handleUpdatePassword}>
          <div className={styles.inputGroup}>
            <label htmlFor="old_password">Current password</label>
            <input
              type="password"
              id="old_password"
              name="old_password"
              value={passwordValues.old_password}
              onChange={handlePasswordChange('old_password')}
              placeholder="Enter current password"
              className={styles.fieldInput}
              autoComplete="current-password"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="new_password">New password</label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={passwordValues.new_password}
              onChange={handlePasswordChange('new_password')}
              placeholder="Min 6 chars, mixed case, number & symbol"
              className={styles.fieldInput}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirm_password">Confirm new password</label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={passwordValues.confirm_password}
              onChange={handlePasswordChange('confirm_password')}
              placeholder="Confirm your new password"
              className={styles.fieldInput}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.passwordActions}>
            <Button
              type="submit"
              size="sm"
              disabled={isUpdatingPassword}
              className={styles.updatePasswordBtn}
            >
              {isUpdatingPassword ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </form>
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

export default AccountSection;
