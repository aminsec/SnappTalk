import { s3Client } from "../config/s3.minio";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { ErrorResponse } from "../types/response.types";

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
        const err: ErrorResponse = {message: "Failed to upload file", state: "Failed", type: "system_error"};
        return [null, err];
    }
}