import React from 'react';
import clsx from 'clsx';
import defaultAvatar from '@/shared/assets/images/avatar.png';
import styles from './ProfileAvatar.module.css';

export type ProfileAvatarSize = 'sm' | 'md' | 'lg' | number;

export interface ProfileAvatarProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  src?: string | null;
  alt?: string;
  size?: ProfileAvatarSize;
  borderColor?: string;
  borderWidth?: number;
  rounded?: boolean;
  className?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  alt = 'Profile avatar image',
  size = 'md',
  borderColor = 'var(--input-border)',
  borderWidth = 2,
  rounded = true,
  className = '',
  ...rest
}) => {
  const isCustomSize = typeof size === 'number';
  const sizeStyle = isCustomSize ? { width: `${size}px`, height: `${size}px` } : {};
  const resolvedSrc = src || defaultAvatar;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={clsx(
        styles.avatar,
        !isCustomSize && styles[size as string],
        rounded && styles.rounded,
        className
      )}
      style={{
        ...sizeStyle,
        border: `${borderWidth}px solid ${borderColor}`,
      }}
      {...rest}
    />
  );
};

export default ProfileAvatar;

