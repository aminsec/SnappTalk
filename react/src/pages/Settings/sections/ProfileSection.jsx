import { useEffect, useState } from 'react';
import styles from './ProfileSection.module.css';
import { Input, Button, ProfileAvatar, ProfileImageUpload } from '@/components';
import { ICONS } from '@/icons';

export default function ProfileSection() {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    username: '',
    isOnline: false,
    profilePic: '',
  });

  const [originalUser, setOriginalUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetch('/api/v1/user/info/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data?.userInfo) {
          const userData = {
            firstName: data.userInfo.firstName || '',
            lastName: data.userInfo.lastName || '',
            email: data.userInfo.email || '',
            bio: data.userInfo.bio || '',
            username: data.userInfo.username || '',
            isOnline: data.userInfo.isOnline || false,
            profilePic: data.userInfo.profilePic || '',
          };
          setUser(userData);
          setOriginalUser(userData);
        }
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setOriginalUser(user);
    setEditMode(false);
  };

  const handleCancel = () => {
    setUser(originalUser);
    setEditMode(false);
  };

  return (
    <div className={styles.profileContainer}>
      {!editMode && (
        <Button size="sm" onClick={() => setEditMode(true)} className={styles.editBtn}>Edit</Button>
      )}

      <div className={styles.avatarRow}>
        {editMode ? (
          <ProfileImageUpload
            currentImage={user.profilePic}
            onImageChange={(file) => {
              console.log(file.result)
            }}
            size={120}
            border
            rounded
          />
        ) : (
          <>
            <ProfileAvatar profilePic={user.profilePic} size={110} className="mb-2" />
            <div>
              <h3>{"@" + user.username}</h3>
              <span className={user.isOnline ? styles.online : styles.offline}>
                {user.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className={styles.formFields}>
        {editMode ? (
          <>
            <div className={styles.editInputCart}>
              <label htmlFor="username">UserName:</label>
              <Input
                name="username"
                id="username"
                value={user.username}
                onChange={handleInputChange}
                fullWidth
              />
            </div>
            <div className={styles.editInputCart}>
              <label htmlFor="email">Email:</label>
              <Input
                name="email"
                id="email"
                value={user.email}
                onChange={handleInputChange}
                fullWidth
              />
            </div>
            <div className={styles.editInputCart}>
              <label htmlFor="bio">Bio:</label>
              <Input
                name="bio"
                id="bio"
                value={user.bio}
                onChange={handleInputChange}
                fullWidth
              />
            </div>

            <div className={styles.actionRow}>
              <Button size="md" variant="outline" onClick={handleCancel} fullWidth>Cancel</Button>
              <Button size="md" onClick={handleSave} fullWidth>Save</Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.infoRow}><span>Username:</span> <strong>{user.username}</strong></div>
            <div className={styles.infoRow}><span>Email:</span> <strong>{user.email}</strong></div>
            <div className={styles.infoRow}><span>Bio:</span> <p>{user.bio || 'No bio yet.'}</p></div>
          </>
        )}
      </div>
    </div>
  );
}
