import { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './ProfileAvatar.module.css';

function ProfileAvatar({
  alt = 'Profile Avatar Image',
  size = 'md', // sm, md, lg, or number
  borderColor = 'var(--input-border)', 
  borderWidth = 2,
  rounded = true,
  className = '',
}) {
  const [imgSrc, setImgSrc] = useState('');
  const isCustomSize = typeof size === 'number';

  useEffect(() => {
    fetch('/api/v1/user/info/')
      .then(res => res.json())
      .then(data => {
        if (data?.userInfo?.profilePic) {
          setImgSrc(data.userInfo.profilePic);
        }
      });
  }, []);

  return (
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
        ...(isCustomSize && {
          width: `${size}px`,
          height: `${size}px`,
        }),
        border: `${borderWidth}px solid ${borderColor}`,
      }}
    />
  );
}

export default ProfileAvatar;