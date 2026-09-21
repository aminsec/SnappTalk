import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare,
  faAt,
  faEnvelope,
  faAlignLeft,
  faCircleCheck,
  faCopy,
  faUser,
  faCircleExclamation,
  faXmark,
  faClock,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';

import { Button, ProfileAvatar, ProfileImageUpload } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import { wallpapers, WALLPAPER_STORAGE_KEY } from '@/shared/utils/wallpapers';

import styles from './ProfileSection.module.css';

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface FormErrorState {
  field: 'username' | 'email' | 'bio' | null;
  message: string;
}

export default function ProfileSection(): React.ReactElement {
  const { user, refreshUser } = useAuth();
  const MAX_BIO_LENGTH = 254;

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
      '--theme-accent-glow': hexToRgba(accent, 0.25),
      '--theme-bubble-start': resolvedWallpaper.bubbleStart || accent,
      '--theme-bubble-end': resolvedWallpaper.bubbleEnd || accentHover,
      '--btn-color': accent,
      '--btn-hover': accentHover,
    } as React.CSSProperties;
  }, [resolvedWallpaper]);

  const [editMode, setEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  // Copy feedback states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setFormValues({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

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

  const handleCopy = async (text: string, label: string) => {
    if (!text) return;
    let success = false;

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
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
      setCopiedField(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error('Unable to auto-copy');
    }
  };

  const handleFieldChange =
    (field: keyof typeof formValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }));
      if (formError?.field === field || !formError?.field) {
        setFormError(null);
      }
    };

  const handleSave = async () => {
    if (isSaving) return;
    setFormError(null);

    const cleanUsername = formValues.username.trim();
    const cleanEmail = formValues.email.trim();

    if (!cleanUsername) {
      const msg = 'Username cannot be empty.';
      setFormError({ field: 'username', message: msg });
      toast.error(msg);
      return;
    }

    if (!cleanEmail) {
      const msg = 'Email address cannot be empty.';
      setFormError({ field: 'email', message: msg });
      toast.error(msg);
      return;
    }

    if (formValues.bio.length > MAX_BIO_LENGTH) {
      const msg = `Bio exceeds maximum length of ${MAX_BIO_LENGTH} characters.`;
      setFormError({ field: 'bio', message: msg });
      toast.error(msg);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/user/info', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          ...user,
          username: cleanUsername,
          email: cleanEmail,
          bio: formValues.bio,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = payload?.message || 'Unable to save changes right now.';
        const lower = errorMsg.toLowerCase();
        let errorField: FormErrorState['field'] = null;
        if (lower.includes('username')) errorField = 'username';
        else if (lower.includes('email')) errorField = 'email';
        else if (lower.includes('bio')) errorField = 'bio';

        setFormError({ field: errorField, message: errorMsg });
        throw new Error(errorMsg);
      }

      await refreshUser();
      toast.success('Profile updated successfully!');
      setFormError(null);
      setEditMode(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormValues({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
    });
    setFormError(null);
    setEditMode(false);
  };

  const bioProgressPercent = Math.min(100, (formValues.bio.length / MAX_BIO_LENGTH) * 100);

  return (
    <div className={styles.profileContainer} style={dynamicThemeStyles}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <span className={styles.eyebrow}>Personal Identity</span>
        <h2>Profile Settings</h2>
        <p>Customize how you appear to others across SnappTalk conversations.</p>
      </div>

      {/* 1. Hero Identity Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroGlowBackdrop} aria-hidden="true" />

        <div className={styles.heroContent}>
          <div className={styles.avatarWrapper}>
            {editMode ? (
              <div className={styles.uploadWrapper}>
                <ProfileImageUpload
                  currentImage={user?.profile_pic}
                  onUploadComplete={() => refreshUser()}
                  size={96}
                  border
                  rounded
                />
                <span className={styles.uploadHint}>Click image to change</span>
              </div>
            ) : (
              <div className={styles.avatarContainer}>
                <ProfileAvatar src={user?.profile_pic} size={96} className={styles.avatar} />
                <span className={styles.statusDot} title="Online" />
              </div>
            )}
          </div>

          <div className={styles.heroDetails}>
            <div className={styles.heroTitleRow}>
              <h3 className={styles.heroUsername}>
                {user?.username ? `@${user.username}` : 'SnappTalk User'}
              </h3>
              <span className={styles.badgeActive}>
                <span className={styles.pulseDot} />
                Active
              </span>
              <span className={styles.badgeRole}>{user?.role || 'Member'}</span>
            </div>
            <p className={styles.heroEmail}>{user?.email || 'No email attached'}</p>

            {memberSince && (
              <div className={styles.memberMeta}>
                <FontAwesomeIcon icon={faClock} className={styles.metaIcon} />
                <span>Joined {memberSince}</span>
              </div>
            )}
          </div>

          {!editMode && (
            <div className={styles.heroActionWrapper}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditMode(true)}
                className={styles.editProfileBtn}
                aria-label="Edit profile"
              >
                <FontAwesomeIcon icon={faPenToSquare} className={styles.btnIcon} />
                Edit profile
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Profile Details / Edit Form Card */}
      <div className={styles.detailsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderIcon}>
            <FontAwesomeIcon icon={editMode ? faPenToSquare : faUser} />
          </div>
          <div>
            <h4>{editMode ? 'Edit Profile Information' : 'Public Profile Details'}</h4>
            <p>
              {editMode
                ? 'Update your username, email, and bio description.'
                : 'This information is visible to other members on SnappTalk.'}
            </p>
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

        {editMode ? (
          /* Edit Mode Form */
          <div className={styles.editForm}>
            {/* Username Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>
                  <FontAwesomeIcon icon={faAt} />
                </span>
                <input
                  name="username"
                  id="username"
                  value={formValues.username}
                  onChange={handleFieldChange('username')}
                  className={`${styles.fieldInput} ${styles.inputWithPrefix} ${
                    formError?.field === 'username' ? styles.fieldInputError : ''
                  }`}
                  placeholder="Enter unique username"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
                <input
                  name="email"
                  id="email"
                  type="email"
                  value={formValues.email}
                  onChange={handleFieldChange('email')}
                  className={`${styles.fieldInput} ${styles.inputWithPrefix} ${
                    formError?.field === 'email' ? styles.fieldInputError : ''
                  }`}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Bio Textarea */}
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="bio">About / Biography</label>
                <span
                  className={`${styles.charBadge} ${
                    formValues.bio.length > MAX_BIO_LENGTH ? styles.charBadgeOver : ''
                  }`}
                >
                  {formValues.bio.length} / {MAX_BIO_LENGTH}
                </span>
              </div>
              <textarea
                name="bio"
                id="bio"
                value={formValues.bio}
                onChange={handleFieldChange('bio')}
                className={`${styles.fieldTextarea} ${
                  formError?.field === 'bio' ? styles.fieldInputError : ''
                }`}
                placeholder="Write a brief bio about yourself..."
                rows={4}
              />
              <div className={styles.charProgressBarContainer}>
                <div
                  className={`${styles.charProgressBar} ${
                    formValues.bio.length > MAX_BIO_LENGTH ? styles.barOver : ''
                  }`}
                  style={{ width: `${bioProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.editActionRow}>
              <Button
                size="md"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className={styles.cancelBtn}
              >
                Cancel
              </Button>
              <Button
                size="md"
                onClick={handleSave}
                disabled={isSaving || formValues.bio.length > MAX_BIO_LENGTH}
                className={styles.saveBtn}
              >
                {isSaving ? 'Saving changes...' : 'Save changes'}
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode Details */
          <div className={styles.viewList}>
            {/* Username Row */}
            <div className={styles.detailRow}>
              <div className={styles.detailIconWrapper}>
                <FontAwesomeIcon icon={faAt} />
              </div>
              <div className={styles.detailBody}>
                <span className={styles.detailLabel}>Username</span>
                <span className={styles.detailValue}>
                  {user?.username ? `@${user.username}` : '—'}
                </span>
              </div>
              {user?.username && (
                <button
                  type="button"
                  onClick={() => handleCopy(`@${user.username}`, 'Username')}
                  className={styles.copyBtn}
                  aria-label="Copy username"
                  title="Copy username"
                >
                  <FontAwesomeIcon icon={copiedField === 'Username' ? faCircleCheck : faCopy} />
                  <span>{copiedField === 'Username' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Email Row */}
            <div className={styles.detailRow}>
              <div className={styles.detailIconWrapper}>
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <div className={styles.detailBody}>
                <span className={styles.detailLabel}>Email Address</span>
                <span className={styles.detailValue}>{user?.email || '—'}</span>
              </div>
              {user?.email && (
                <button
                  type="button"
                  onClick={() => handleCopy(user.email, 'Email')}
                  className={styles.copyBtn}
                  aria-label="Copy email"
                  title="Copy email"
                >
                  <FontAwesomeIcon icon={copiedField === 'Email' ? faCircleCheck : faCopy} />
                  <span>{copiedField === 'Email' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Bio Row */}
            <div className={styles.detailRow}>
              <div className={styles.detailIconWrapper}>
                <FontAwesomeIcon icon={faAlignLeft} />
              </div>
              <div className={styles.detailBody}>
                <span className={styles.detailLabel}>About / Bio</span>
                <p className={`${styles.detailValue} ${!user?.bio ? styles.detailPlaceholder : ''}`}>
                  {user?.bio || 'No biography added yet. Click "Edit profile" to introduce yourself!'}
                </p>
              </div>
            </div>

            {/* Security summary */}
            <div className={styles.profileMetaNotice}>
              <FontAwesomeIcon icon={faShieldHalved} className={styles.noticeIcon} />
              <span>
                Your profile picture, username, and bio are shared with contacts and groups you join.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
