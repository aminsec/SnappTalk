import { s3Client } from "../config/s3.minio";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { ErrorResponse } from "../types/response.types";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function uploadMediaToS3(file: Express.Multer.File, bucketName: string): Promise<[string | null, ErrorResponse | null]> {
    //Uploading the file to s3 
    const key = `${randomUUID()}-${file.originalname}`;

    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: "application/octet-stream", // We set to only binary data response for secure loading
        }));

        return [key, null];

    } catch (error) {
        console.error("Error uploading file to S3:", error);
        const err: ErrorResponse = {message: "Failed to upload file", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function generatePreSignedURL(bucketName: string, fileKey: string): Promise<[string | null, ErrorResponse | null]> {
    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // seconds
        const path = "/download" + new URL(url).pathname + new URL(url).search;
        return [path, null];

    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        const err: ErrorResponse = {message: "Failed to generate pre-signed URL", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function deleteFileFromS3(fileKey: string, bucketName: string): Promise<[Boolean | null, ErrorResponse | null]>  {
    try {
        // Preventing deleting default image
        if(fileKey === "default.png"){
            return [true, null];
        }

        await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
            })
          );

        return [true, null]

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};