import React, { useRef, useState } from 'react';
import styles from './ProfileImageUpload.module.css';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange?: (file: File) => void;
  onUploadComplete?: () => void;
  size?: number;
  border?: boolean;
  rounded?: boolean;
  className?: string;
}

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      onImageChange?.(file);
      const resultString = reader.result as string;
      setPreview(resultString);

      // Requesting to upload image
      const requestBody = {
        content: resultString.split(',').pop(), // removing data:image url
      };

      try {
        const request = await fetch('/api/v1/user/info/profile', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (request.ok) {
          toast.success('Profile image updated');
          onUploadComplete?.();
        } else if (request.status === 413) {
          toast.error('File is too large. Maximum is 5MB');
        } else {
          toast.error("Couldn't upload image");
        }
      } catch (err) {
        toast.error("Couldn't upload image");
      }
    };
    reader.readAsDataURL(file);
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
      onClick={() => fileRef.current?.click()}
    >
      <img
        src={preview || currentImage}
        alt="Profile"
        className={styles.image}
        style={{
          borderRadius: rounded ? '50%' : '8px',
        }}
      />
      <div className={styles.overlay}>Change</div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.fileInput}
      />
    </div>
  );
}

