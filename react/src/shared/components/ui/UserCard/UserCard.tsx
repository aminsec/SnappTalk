import React from 'react';
import clsx from 'clsx';
import ProfileAvatar from '../ProfileAvatar/ProfileAvatar';
import { AUTH_STATUS } from '@/shared/state/userStateContext';
import { useAuth } from '@/shared/state/useAuth';
import styles from './UserCard.module.css';

export interface UserCardProps {
  width?: string | number;
  fullWidth?: boolean;
  avatarSize?: number;
  textSize?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  width,
  fullWidth = false,
  avatarSize = 52,
  textSize = 'md',
  className = '',
  onClick,
}) => {
  const { status, user } = useAuth();
  const isLoading = status === AUTH_STATUS.LOADING;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        styles.Profilcart,
        styles[textSize],
        onClick && styles.clickable,
        className
      )}
      style={{
        width: fullWidth ? '100%' : width || 'auto',
      }}
    >
      {isLoading ? (
        <>
          <div
            className={styles.skeletonAvatar}
            style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
          />
          <div className={styles.skeletonText}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLineShort} />
          </div>
        </>
      ) : (
        <>
          <div className={styles.avatarWrapper}>
            <ProfileAvatar size={avatarSize} src={user?.profile_pic} className={styles.avatar} />
            <span className={styles.statusDot} title="Online" />
          </div>
          <div className={styles.ProfileartInfo}>
            <h3 title={user?.username ? `@${user.username}` : ''}>
              {user?.username ? `@${user.username}` : 'Guest User'}
            </h3>
            <p title={user?.bio || user?.email || ''}>
              {user?.bio || user?.email || 'View profile'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default UserCard;
