import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Button, Input, ProfileAvatar, ProfileImageUpload } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';

import styles from './ProfileSection.module.css';

export default function ProfileSection() {
  const { user, refreshUser } = useAuth();
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

    // Validation
    if (!formValues.username || formValues.username.trim().length === 0) {
      toast.error('Username is required.');
      return;
    }

    if (formValues.username.length > 24) {
      toast.error('Username can be at most 24 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(formValues.username)) {
      toast.error('Username can include letters, numbers, "." or "_".');
      return;
    }

    if (!formValues.email || formValues.email.trim().length === 0) {
      toast.error('Email is required.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formValues.email)) {
      toast.error('Please enter a valid email address.');
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
      {!editMode && (
        <Button size="sm" onClick={() => setEditMode(true)} className={styles.editBtn}>
          Edit
        </Button>
      )}

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
              <span className={user?.isOnline ? styles.online : styles.offline}>
                {user?.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className={styles.formFields}>
        {editMode ? (
          <>
            <div className={styles.editInputCart}>
              <label htmlFor="username">Username:</label>
              <Input
                name="username"
                id="username"
                value={formValues.username}
                onChange={handleFieldChange('username')}
                fullWidth
              />
            </div>
            <div className={styles.editInputCart}>
              <label htmlFor="email">Email:</label>
              <Input
                name="email"
                id="email"
                value={formValues.email}
                onChange={handleFieldChange('email')}
                fullWidth
              />
            </div>
            <div className={styles.editInputCart}>
              <label htmlFor="bio">Bio:</label>
              <Input
                name="bio"
                id="bio"
                value={formValues.bio}
                onChange={handleFieldChange('bio')}
                fullWidth
              />
            </div>

            <div className={styles.actionRow}>
              <Button size="md" variant="outline" onClick={handleCancel} fullWidth>
                Cancel
              </Button>
              <Button size="md" onClick={handleSave} fullWidth disabled={isSaving}>
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
          </>
        )}
      </div>
    </div>
  );
}
