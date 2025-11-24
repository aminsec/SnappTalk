import clsx from 'clsx';

import { ProfileAvatar } from '@/shared/components';
import { AUTH_STATUS } from '@/shared/state/userStateContext';
import { useAuth } from '@/shared/state/useAuth';

import styles from './UserCard.module.css';

function UserCard({
  width,
  fullWidth = false,
  textSize = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const { status, user } = useAuth();
  const isLoading = status === AUTH_STATUS.LOADING;

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
          <ProfileAvatar size={70} src={user?.profile_pic} />
          <div className={styles.ProfileartInfo}>
            <h3>{user?.username || 'Guest'}</h3>
            <p>{user?.bio || 'No bio yet.'}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default UserCard;
