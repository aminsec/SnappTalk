import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Button, ProfileAvatar, ProfileImageUpload } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';

import styles from './ProfileSection.module.css';

export default function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const MAX_BIO_LENGTH = 254;
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }
    if (formValues.bio.length > MAX_BIO_LENGTH) {
      toast.error(`Bio must be at most ${MAX_BIO_LENGTH} characters.`);
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
          ...formValues,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Unable to save changes right now.');
      }

      await refreshUser();
      toast.success('Profile updated.');
      setEditMode(false);
    } catch (error) {
      toast.error(error?.message || 'Failed to update profile.');
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
    setEditMode(false);
  };

  return (
    <div className={styles.profileContainer}>
      {/* edit button removed from the header; moved below the Bio */}

      <div className={styles.avatarRow}>
        {editMode ? (
          <ProfileImageUpload
            currentImage={user?.profile_pic}
            onUploadComplete={() => refreshUser()}
            size={120}
            border
            rounded
          />
        ) : (
          <>
            <ProfileAvatar src={user?.profile_pic} size={110} className="mb-2" />
            <div>
              <h3>{user?.username ? `@${user.username}` : 'Unknown user'}</h3>
            </div>
          </>
        )}
      </div>

      <div className={styles.formFields}>
        {editMode ? (
          <>
            <div className={styles.editInputCart}>
              <label htmlFor="username">Username:</label>
              <input
                name="username"
                id="username"
                value={formValues.username}
                onChange={handleFieldChange('username')}
                className={styles.editFieldInput}
                autoComplete="username"
              />
            </div>
            <div className={styles.editInputCart}>
              <label htmlFor="email">Email:</label>
              <input
                name="email"
                id="email"
                value={formValues.email}
                onChange={handleFieldChange('email')}
                className={styles.editFieldInput}
                autoComplete="email"
              />
            </div>
            <div className={styles.editInputCart}>
              <label htmlFor="bio">Bio:</label>
              <textarea
                name="bio"
                id="bio"
                value={formValues.bio}
                onChange={handleFieldChange('bio')}
                className={styles.editFieldTextarea}
                rows={3}
              />
              <div
                className={`${styles.charCount} ${
                  formValues.bio.length > MAX_BIO_LENGTH ? styles.charCountOver : ''
                }`}
              >
                {formValues.bio.length}/{MAX_BIO_LENGTH}
              </div>
            </div>

            <div className={styles.actionRow}>
              <Button size="md" variant="outline" onClick={handleCancel} fullWidth className={styles.editButton}>
                Cancel
              </Button>
              <Button
                size="md"
                onClick={handleSave}
                fullWidth
                disabled={isSaving || formValues.bio.length > MAX_BIO_LENGTH}
                className={styles.editButtonPrimary}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.infoRow}>
              <span>Username:</span> <strong>{user?.username || '—'}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Email:</span> <strong>{user?.email || '—'}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Bio:</span> <p>{user?.bio || 'No bio yet.'}</p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditMode(true)}
              className={styles.editBtn}
              aria-label="Edit profile"
            >
              Edit profile
            </Button>

          </>
        )}
      </div>
    </div>
  );
}
