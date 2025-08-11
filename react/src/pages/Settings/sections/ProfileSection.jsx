import { useEffect, useState } from 'react';
import styles from './ProfileSection.module.css';
import { Input, Button, ProfileAvatar, ProfileImageUpload } from '@/components';
import { ICONS } from '@/icons';
import toast from 'react-hot-toast';

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
  let [usernameValue, setUsernameValue] = useState();
  let [emailValue, setEmailValue] = useState();
  let [bioValue, setBioValue] = useState();

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
          setUsernameValue(userData.username);
          setBioValue(userData.bio);
          setEmailValue(userData.email);
          setOriginalUser(userData);
        };
      });
  }, []);

  const handleUsernameChange = (e) => {
    const { name, value } = e.target;
    setUsernameValue(value);
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailValue(value);
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleBioChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
    setBioValue(value);
  };

  const handleSave = async () => {
    //Requesting to update user public info
    const reqeustBody = {
      email: emailValue,
      username: usernameValue,
      bio: bioValue
    };

    const request = await fetch("/api/v1/user/info", {
      method: "PUT",
      credentials: "include",
      headers: {
        "content-type": "application/json"
      },

      body: JSON.stringify(reqeustBody)
    });

    if(request.ok){
      window.location.reload();

    }else{
      const resp = await request.json();
      toast.error(resp.message)
    }
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
                onChange={handleUsernameChange}
                fullWidth
              />
            </div>
            <div className={styles.editInputCart}>
              <label htmlFor="email">Email:</label>
              <Input
                name="email"
                id="email"
                value={user.email}
                onChange={handleEmailChange}
                fullWidth
              />
            </div>
            <div className={styles.editInputCart}>
              <label htmlFor="bio">Bio:</label>
              <Input
                name="bio"
                id="bio"
                value={user.bio}
                onChange={handleBioChange}
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
