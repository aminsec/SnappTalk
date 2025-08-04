import { useEffect, useState } from 'react';
import styles from './UserCard.module.css';
import { ProfileAvatar } from '@/components';
import clsx from 'clsx';

function UserCard({
  width,
  fullWidth = false,
  textSize = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v1/user/info/', { credentials: 'include' });
        const data = await res.json();
        if (data?.userInfo) {
          setUser(data.userInfo);
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <div
      className={clsx(styles.Profilcart, styles[textSize], className)}
      style={{
        width: fullWidth ? '100%' : width || 'auto',
      }}
    >
      {isLoading ? (
        <>
          <div className={styles.skeletonAvatar}></div>
          <div className={styles.skeletonText}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLineShort} />
          </div>
        </>
      ) : (
        <>
          <ProfileAvatar size={70} />
          <div className={styles.ProfileartInfo}>
            <h3>{user.username}</h3>
            <p>{user.bio}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default UserCard;
