import { useRef, useState } from "react";
import styles from "./ProfileImageUpload.module.css";
import clsx from "clsx";
import toast, { Toaster } from 'react-hot-toast';

export default function ProfileImageUpload({
  currentImage,
  onImageChange,
  onUploadComplete,
  size = 100,
  border = true,
  rounded = true,
  className = '',
}) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);

  const handleFileChange =  (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async() => {
      onImageChange?.(file);
      setPreview(reader.result);

      //Requesting to upload image
      const requestBody = {
        content: reader.result.split(",").pop() // removing data:image url
      };

      const request = await fetch("/api/v1/user/info/profile", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },

        body: JSON.stringify(requestBody)
      });

      if(request.ok){
        toast.success("Profile image updated");
        onUploadComplete?.();
      }
      if(request.status === 413){
        toast.error("File is too large. Maximum is 5MB");
      }

      if(!request.ok && request.status !== 413){
        toast.error("Couldn't upload image");
      }
    };
    reader.readAsDataURL(file);    
  };

  return (
    <>
    <Toaster position="top-center" />
    <div
      className={clsx(styles.wrapper, className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: border ? '2px solid var(--input-border)' : 'none',
        borderRadius: rounded ? '50%' : '8px',
      }}
      onClick={() => fileRef.current.click()}
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
    </>
  );
}
