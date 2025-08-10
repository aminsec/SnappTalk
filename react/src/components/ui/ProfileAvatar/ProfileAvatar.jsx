import { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './ProfileAvatar.module.css';
import defaultAvatar from '@/assets/images/avatar.png';

function ProfileAvatar({
  alt = 'Profile Avatar Image',
  size = 'md', // sm, md, lg, or number
  borderColor = 'var(--input-border)',
  borderWidth = 2,
  rounded = true,
  className = '',
}) {
  const [imgSrc, setImgSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isCustomSize = typeof size === 'number';

  useEffect(() => {
    fetch('/api/v1/user/info/')
      .then(res => res.json())
      .then(data => {
        if (data?.userInfo?.profilePic) {
          const pic = data.userInfo.profilePic;
          if (pic === '/statics/images/default.png') {
            setImgSrc(defaultAvatar);
          } else {
            setImgSrc(pic);
          }
        }
      })
      .catch(err => {
        console.error('Error fetching profilePic:', err);
        setImgSrc(defaultAvatar);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const sizeStyle = isCustomSize
    ? { width: `${size}px`, height: `${size}px` }
    : {};

  return isLoading ? (
    <div
      className={clsx(
        styles.avatar,
        styles.skeleton,
        !isCustomSize && styles[size],
        rounded && styles.rounded,
        className
      )}
      style={{
        ...sizeStyle,
        border: `${borderWidth}px solid ${borderColor}`,
      }}
    />
  ) : (
    <img
      src={imgSrc}
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
    />
  );
}

export default ProfileAvatar;
