import { Request, Response } from "express";
import { s3Client, BUCKETS } from "../../config/s3.minio";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { showError, sendResponse } from "../../utils/operations";
import { randomUUID } from "crypto";
import { ErrorResponse } from "../../types/response.types";

export async function handleMediaUpload(req: Request, res: Response){

    if(!req.file) {
        const error: ErrorResponse = {message: "File is required", state: "Failed", type: "input_error"};
        showError(error, res);
        return;
    }

    //Uploading the file to s3 
    const key = `${randomUUID()}-${req.file.originalname}`;

    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKETS.MEDIA,
            Key: key,
            Body: req.file.buffer,
            ContentType: "application/octet-stream", // We set to only binary data response for secure loading
        }));

        const responseData = {state: "success", message: "File uploaded successfully", fileKey: key};
        sendResponse(responseData, {}, 200, res);

    } catch (error) {
        console.error("Error uploading file to S3:", error);
        const err: ErrorResponse = {message: "Failed to upload file", state: "Failed", type: "system_error"};
        showError(err, res);
        return;
    }
};