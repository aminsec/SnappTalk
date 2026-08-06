import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // REQUIRED for MinIO — uses path-style URLs instead of virtual-hosted
});

//We can read these from process.env or set them as default values, but for clean code we export them as constants to be used in other parts of the application.
export const BUCKETS = {
  PROFILE_PICS: process.env.MINIO_PUBLIC_BUCKET || 'profilepics',
  MEDIA: process.env.MINIO_PRIVATE_BUCKET || 'media',
} as const;

console.log("Connected to MinIO S3 ");