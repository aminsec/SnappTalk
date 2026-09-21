import React, { useRef, useState, useEffect } from 'react';
import styles from './ProfileImageUpload.module.css';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import defaultAvatar from '@/shared/assets/images/avatar.png';

export interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange?: (file: File) => void;
  onUploadComplete?: () => void;
  size?: number;
  border?: boolean;
  rounded?: boolean;
  className?: string;
}

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfileImageUpload({
  currentImage,
  onImageChange,
  onUploadComplete,
  size = 100,
  border = true,
  rounded = true,
  className = '',
}: ProfileImageUploadProps): React.ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.error('File is too large. Maximum is 5MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onImageChange?.(file);

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const response = await fetch('/api/v1/user/info/profile', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success(data?.message || 'Profile image updated');
        onUploadComplete?.();
      } else if (response.status === 413) {
        toast.error('File is too large. Maximum is 5MB');
      } else {
        toast.error(data?.message || "Couldn't upload image");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={clsx(styles.wrapper, className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: border ? '2px solid var(--input-border)' : 'none',
        borderRadius: rounded ? '50%' : '8px',
      }}
      onClick={() => {
        if (!isUploading) {
          fileRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
          e.preventDefault();
          fileRef.current?.click();
        }
      }}
      aria-label="Upload profile image"
    >
      <img
        src={preview || currentImage || defaultAvatar}
        alt="Profile avatar"
        className={styles.image}
        style={{
          borderRadius: rounded ? '50%' : '8px',
        }}
      />
      <div className={styles.overlay}>
        {isUploading ? 'Uploading…' : 'Change'}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.fileInput}
        disabled={isUploading}
      />
    </div>
  );
}
