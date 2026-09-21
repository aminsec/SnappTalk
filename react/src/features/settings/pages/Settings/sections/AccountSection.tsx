import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faKey,
  faLock,
  faEye,
  faEyeSlash,
  faTriangleExclamation,
  faTrashCan,
  faCheck,
  faCopy,
  faEnvelope,
  faClock,
  faCircleCheck,
  faIdBadge,
  faPalette,
  faCircleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { Button, ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import { wallpapers, WALLPAPER_STORAGE_KEY } from '@/shared/utils/wallpapers';

import styles from './AccountSection.module.css';

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface FormErrorState {
  field: 'old_password' | 'new_password' | 'confirm_password' | null;
  message: string;
}

const AccountSection: React.FC = () => {
  const { user } = useAuth();

  // 1. Dynamic Appearance Theme Sync
  const [wallpaperId, setWallpaperId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'aurora';
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'aurora';
  });

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WALLPAPER_STORAGE_KEY && event.newValue) {
        setWallpaperId(event.newValue);
      }
    };

    const handleCustomChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ wallpaperId: string }>;
      if (customEvent.detail?.wallpaperId) {
        setWallpaperId(customEvent.detail.wallpaperId);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('wallpaper-change', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('wallpaper-change', handleCustomChange);
    };
  }, []);

  const resolvedWallpaper = useMemo(() => {
    return (
      wallpapers.find((w) => w.id === wallpaperId) ||
      wallpapers.find((w) => w.id === 'aurora') ||
      wallpapers[0]
    );
  }, [wallpaperId]);

  const dynamicThemeStyles = useMemo(() => {
    const accent = resolvedWallpaper.accent || '#3390ec';
    const accentHover = resolvedWallpaper.accentHover || '#2678c7';
    return {
      '--theme-accent': accent,
      '--theme-accent-hover': accentHover,
      '--theme-accent-soft': hexToRgba(accent, 0.12),
      '--theme-accent-border': hexToRgba(accent, 0.28),
      '--theme-accent-glow': hexToRgba(accent, 0.2),
      '--theme-bubble-start': resolvedWallpaper.bubbleStart || accent,
      '--theme-bubble-end': resolvedWallpaper.bubbleEnd || accentHover,
      '--btn-color': accent,
      '--btn-hover': accentHover,
    } as React.CSSProperties;
  }, [resolvedWallpaper]);

  // Delete modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Password fields state
  const [passwordValues, setPasswordValues] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Error state for fresh inline error experience
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  // Password visibility toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Copy ID feedback state
  const [copiedId, setCopiedId] = useState(false);

  const displayId = (user?._id || user?.id || '').toString();

  const memberSince = useMemo(() => {
    if (!user?.joined_at) return null;
    try {
      return new Date(user.joined_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  }, [user?.joined_at]);

  // Real-time password requirement checks
  const passwordChecks = useMemo(() => {
    const { new_password, confirm_password } = passwordValues;
    return {
      length: new_password.length >= 6 && new_password.length <= 24,
      mixedCase: /[a-z]/.test(new_password) && /[A-Z]/.test(new_password),
      number: /\d/.test(new_password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(new_password),
      matches: confirm_password.length > 0 && new_password === confirm_password,
    };
  }, [passwordValues]);

  // Password strength calculation (0 to 4)
  const strengthScore = useMemo(() => {
    const { new_password } = passwordValues;
    if (!new_password) return 0;
    let score = 0;
    if (new_password.length >= 6) score++;
    if (passwordChecks.mixedCase) score++;
    if (passwordChecks.number) score++;
    if (passwordChecks.special) score++;
    if (new_password.length >= 10 && score >= 3) score = Math.min(4, score + 1);
    return score;
  }, [passwordValues.new_password, passwordChecks]);

  const strengthLabel = useMemo(() => {
    if (!passwordValues.new_password) return { text: '', color: '' };
    switch (strengthScore) {
      case 1:
        return { text: 'Weak', color: styles.strengthWeak };
      case 2:
        return { text: 'Fair', color: styles.strengthFair };
      case 3:
        return { text: 'Good', color: styles.strengthGood };
      case 4:
        return { text: 'Strong', color: styles.strengthStrong };
      default:
        return { text: 'Very Weak', color: styles.strengthWeak };
    }
  }, [passwordValues.new_password, strengthScore]);

  const handlePasswordChange =
    (field: keyof typeof passwordValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setPasswordValues((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Clear error on relevant field edit
      if (formError?.field === field || !formError?.field) {
        setFormError(null);
      }
    };

  // Robust cross-browser Clipboard copy with fallback
  const handleCopyId = async () => {
    if (!displayId) {
      const errorMsg = 'Account ID is not loaded yet.';
      setFormError({ field: null, message: errorMsg });
      toast.error(errorMsg);
      return;
    }

    let success = false;

    // 1. Try modern navigator.clipboard if available (works on HTTPS/localhost)
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      try {
        await navigator.clipboard.writeText(displayId);
        success = true;
      } catch {
        success = false;
      }
    }

    // 2. Reliable fallback for HTTP, older engines, and iframe environments
    if (!success && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = displayId;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        textArea.style.opacity = '0';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopiedId(true);
      toast.success('Account ID copied to clipboard!');
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      toast.error('Unable to auto-copy. You can select and copy the ID manually.');
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const { old_password, new_password, confirm_password } = passwordValues;

    if (!old_password) {
      const msg = 'Please enter your current password.';
      setFormError({ field: 'old_password', message: msg });
      toast.error(msg);
      return;
    }

    if (!new_password) {
      const msg = 'Please enter a new password.';
      setFormError({ field: 'new_password', message: msg });
      toast.error(msg);
      return;
    }

    if (new_password.length < 6 || new_password.length > 24) {
      const msg = 'New password must be 6–24 characters long.';
      setFormError({ field: 'new_password', message: msg });
      toast.error(msg);
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
    if (!passwordRegex.test(new_password)) {
      const msg = 'Password must include uppercase, lowercase, numbers, and special symbols.';
      setFormError({ field: 'new_password', message: msg });
      toast.error(msg);
      return;
    }

    if (new_password !== confirm_password) {
      const msg = 'New passwords do not match. Please re-check confirmation.';
      setFormError({ field: 'confirm_password', message: msg });
      toast.error(msg);
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
        const errorMsg = payload?.message || 'Unable to update password.';
        setFormError({
          field: errorMsg.toLowerCase().includes('old password') ? 'old_password' : 'new_password',
          message: errorMsg,
        });
        throw new Error(errorMsg);
      }

      toast.success('Password updated successfully!');
      setPasswordValues({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setFormError(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password.');
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete account right now.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmationText('');
    setShowDeleteConfirm(true);
  };

  return (
    <div className={styles.accountContainer} style={dynamicThemeStyles}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <span className={styles.eyebrow}>Security & Credentials</span>
        <h2>Account Settings</h2>
        <p>Manage your account identity, security preferences, and sensitive actions.</p>
      </div>

      {/* 1. Account Overview Card (Styled with Appearance Theme) */}
      <div className={styles.overviewCard}>
        <div className={styles.overviewTop}>
          <div className={styles.avatarWrapper}>
            <ProfileAvatar src={user?.profile_pic} size={64} className={styles.avatar} />
            <span className={styles.activeIndicator} title="Account active" />
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userTitleRow}>
              <h3 className={styles.username}>
                {user?.username ? `@${user.username}` : 'SnappTalk User'}
              </h3>
              <span className={styles.badgeProtected}>
                <FontAwesomeIcon icon={faShieldHalved} className={styles.badgeIcon} />
                Secured
              </span>
              <span className={styles.themeBadge}>
                <FontAwesomeIcon icon={faPalette} className={styles.themeIcon} />
                {resolvedWallpaper.label}
              </span>
            </div>
            <p className={styles.userEmail}>{user?.email || 'No email registered'}</p>
          </div>
        </div>

        <div className={styles.credentialsGrid}>
          <div className={styles.credItem}>
            <div className={styles.credIconWrapper}>
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <div className={styles.credContent}>
              <span className={styles.credLabel}>Registered Email</span>
              <span className={styles.credValue} title={user?.email || ''}>
                {user?.email || '—'}
              </span>
            </div>
          </div>

          <div className={styles.credItem}>
            <div className={styles.credIconWrapper}>
              <FontAwesomeIcon icon={faIdBadge} />
            </div>
            <div className={styles.credContent}>
              <span className={styles.credLabel}>Account ID</span>
              <div className={styles.idRow}>
                <code
                  className={styles.idCode}
                  title={displayId ? `Click to copy: ${displayId}` : ''}
                  onClick={handleCopyId}
                >
                  {displayId ? `${displayId.slice(0, 10)}...` : '—'}
                </code>
                {displayId && (
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className={styles.copyBtn}
                    aria-label="Copy Account ID"
                    title="Copy full Account ID"
                  >
                    <FontAwesomeIcon icon={copiedId ? faCheck : faCopy} />
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {memberSince && (
            <div className={styles.credItem}>
              <div className={styles.credIconWrapper}>
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className={styles.credContent}>
                <span className={styles.credLabel}>Member Since</span>
                <span className={styles.credValue}>{memberSince}</span>
              </div>
            </div>
          )}

          <div className={styles.credItem}>
            <div className={styles.credIconWrapper}>
              <FontAwesomeIcon icon={faLock} />
            </div>
            <div className={styles.credContent}>
              <span className={styles.credLabel}>Auth Method</span>
              <span className={styles.credValue}>Email & Password</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Password & Authentication Card */}
      <div className={styles.cardSection}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderIconWrapper}>
            <FontAwesomeIcon icon={faKey} />
          </div>
          <div>
            <h4>Change Password</h4>
            <p>Enhance your security by selecting a robust, unique password.</p>
          </div>
        </div>

        {/* Fresh Inline Error Alert Banner */}
        {formError && (
          <div className={styles.errorAlert} role="alert">
            <div className={styles.errorAlertIcon}>
              <FontAwesomeIcon icon={faCircleExclamation} />
            </div>
            <div className={styles.errorAlertContent}>
              <strong>Attention</strong>
              <p>{formError.message}</p>
            </div>
            <button
              type="button"
              className={styles.errorAlertDismiss}
              onClick={() => setFormError(null)}
              aria-label="Dismiss error"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}

        <form className={styles.passwordForm} onSubmit={handleUpdatePassword}>
          {/* Current Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="old_password">Current Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showOldPassword ? 'text' : 'password'}
                id="old_password"
                name="old_password"
                value={passwordValues.old_password}
                onChange={handlePasswordChange('old_password')}
                placeholder="Enter current password"
                className={`${styles.fieldInput} ${
                  formError?.field === 'old_password' ? styles.fieldInputError : ''
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.toggleVisibilityBtn}
                onClick={() => setShowOldPassword(!showOldPassword)}
                aria-label={showOldPassword ? 'Hide current password' : 'Show current password'}
              >
                <FontAwesomeIcon icon={showOldPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className={styles.inputGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="new_password">New Password</label>
              {passwordValues.new_password && (
                <span className={`${styles.strengthBadge} ${strengthLabel.color}`}>
                  {strengthLabel.text}
                </span>
              )}
            </div>
            <div className={styles.inputWrapper}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="new_password"
                name="new_password"
                value={passwordValues.new_password}
                onChange={handlePasswordChange('new_password')}
                placeholder="Enter new password"
                className={`${styles.fieldInput} ${
                  formError?.field === 'new_password' ? styles.fieldInputError : ''
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.toggleVisibilityBtn}
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Strength meter bar */}
            {passwordValues.new_password && (
              <div className={styles.strengthMeterContainer}>
                <div
                  className={`${styles.strengthMeterBar} ${
                    strengthScore >= 1 ? styles.meterFilled1 : ''
                  }`}
                />
                <div
                  className={`${styles.strengthMeterBar} ${
                    strengthScore >= 2 ? styles.meterFilled2 : ''
                  }`}
                />
                <div
                  className={`${styles.strengthMeterBar} ${
                    strengthScore >= 3 ? styles.meterFilled3 : ''
                  }`}
                />
                <div
                  className={`${styles.strengthMeterBar} ${
                    strengthScore >= 4 ? styles.meterFilled4 : ''
                  }`}
                />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="confirm_password">Confirm New Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm_password"
                name="confirm_password"
                value={passwordValues.confirm_password}
                onChange={handlePasswordChange('confirm_password')}
                placeholder="Re-type your new password"
                className={`${styles.fieldInput} ${
                  formError?.field === 'confirm_password' ? styles.fieldInputError : ''
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.toggleVisibilityBtn}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* Real-time requirements checklist */}
          <div className={styles.requirementsBox}>
            <span className={styles.requirementsTitle}>Password Requirements:</span>
            <div className={styles.requirementsGrid}>
              <div
                className={`${styles.reqItem} ${
                  passwordChecks.length ? styles.reqMet : styles.reqUnmet
                }`}
              >
                <FontAwesomeIcon
                  icon={passwordChecks.length ? faCircleCheck : faCheck}
                  className={styles.reqIcon}
                />
                <span>6 to 24 characters</span>
              </div>
              <div
                className={`${styles.reqItem} ${
                  passwordChecks.mixedCase ? styles.reqMet : styles.reqUnmet
                }`}
              >
                <FontAwesomeIcon
                  icon={passwordChecks.mixedCase ? faCircleCheck : faCheck}
                  className={styles.reqIcon}
                />
                <span>Uppercase & lowercase letters</span>
              </div>
              <div
                className={`${styles.reqItem} ${
                  passwordChecks.number ? styles.reqMet : styles.reqUnmet
                }`}
              >
                <FontAwesomeIcon
                  icon={passwordChecks.number ? faCircleCheck : faCheck}
                  className={styles.reqIcon}
                />
                <span>At least one number (0-9)</span>
              </div>
              <div
                className={`${styles.reqItem} ${
                  passwordChecks.special ? styles.reqMet : styles.reqUnmet
                }`}
              >
                <FontAwesomeIcon
                  icon={passwordChecks.special ? faCircleCheck : faCheck}
                  className={styles.reqIcon}
                />
                <span>Special symbol (!@#$%^&*...)</span>
              </div>
              {passwordValues.confirm_password && (
                <div
                  className={`${styles.reqItem} ${
                    passwordChecks.matches ? styles.reqMet : styles.reqUnmet
                  }`}
                >
                  <FontAwesomeIcon
                    icon={passwordChecks.matches ? faCircleCheck : faCheck}
                    className={styles.reqIcon}
                  />
                  <span>Passwords match</span>
                </div>
              )}
            </div>
          </div>

          {/* Advisory Notice */}
          <div className={styles.securityNotice}>
            <FontAwesomeIcon icon={faLock} className={styles.noticeIcon} />
            <span>
              Updating your password will safeguard your conversations and require entering your new
              credentials next time you log in.
            </span>
          </div>

          {/* Actions */}
          <div className={styles.passwordActions}>
            <Button
              type="submit"
              size="md"
              disabled={isUpdatingPassword}
              className={styles.updatePasswordBtn}
            >
              {isUpdatingPassword ? 'Updating password...' : 'Update password'}
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Danger Zone (Accurate Copy: Messages, files, and shared content remain) */}
      <div className={styles.dangerZoneCard}>
        <div className={styles.dangerHeader}>
          <div className={styles.dangerIconBadge}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <div className={styles.dangerCopy}>
            <h4>Delete Account</h4>
            <p>Permanently remove your login credentials, user identity, and profile settings.</p>
          </div>
        </div>

        <div className={styles.dangerNoticeList}>
          <div className={styles.dangerNoticeItem}>
            <span className={styles.dangerBullet}>•</span>
            <span>Your profile information, login credentials, and personal settings will be permanently removed.</span>
          </div>
          <div className={styles.dangerNoticeItem}>
            <span className={styles.dangerBullet}>•</span>
            <span>Your previously sent messages, shared files, and media will remain in conversations for other members.</span>
          </div>
          <div className={styles.dangerNoticeItem}>
            <span className={styles.dangerBullet}>•</span>
            <span>All your active sessions will be terminated immediately. This action cannot be reversed.</span>
          </div>
        </div>

        <div className={styles.dangerActionRow}>
          <Button
            size="sm"
            variant="danger"
            onClick={openDeleteModal}
            className={styles.deleteBtn}
            aria-label="Delete account"
          >
            <FontAwesomeIcon icon={faTrashCan} className={styles.btnIcon} />
            Delete account
          </Button>
        </div>
      </div>

      {/* 4. Delete Confirmation Modal (Accurate Copy) */}
      {showDeleteConfirm && (
        <div
          className={styles.confirmOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalWarningIcon}>
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
              <h4 className={styles.confirmTitle}>Delete SnappTalk Account?</h4>
            </div>

            <p className={styles.confirmText}>
              This action <strong>cannot be undone</strong>. Your account credentials will be
              permanently removed and all sessions terminated. Your sent messages and files will
              remain in existing conversations.
            </p>

            <div className={styles.confirmInputGroup}>
              <label htmlFor="delete-confirm-input" className={styles.confirmInputLabel}>
                Please type <strong className={styles.deleteKeyword}>delete</strong> to confirm:
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                placeholder="delete"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className={styles.confirmInput}
                autoFocus
              />
            </div>

            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmationText.trim().toLowerCase() !== 'delete'}
              >
                {isDeleting ? 'Deleting account...' : 'Yes, delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSection;
