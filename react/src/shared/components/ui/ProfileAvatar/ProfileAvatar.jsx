import clsx from 'clsx';

import defaultAvatar from '@/shared/assets/images/avatar.png';

import styles from './ProfileAvatar.module.css';

function ProfileAvatar({
  src,
  alt = 'Profile avatar image',
  size = 'md', // sm, md, lg, or number
  borderColor = 'var(--input-border)',
  borderWidth = 2,
  rounded = true,
  className = '',
  ...rest
}) {
  const isCustomSize = typeof size === 'number';
  const sizeStyle = isCustomSize ? { width: `${size}px`, height: `${size}px` } : {};
  const resolvedSrc = src || defaultAvatar;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={clsx(
        styles.avatar,
        !isCustomSize && styles[size],
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
}

export default ProfileAvatar;
