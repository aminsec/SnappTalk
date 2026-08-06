import { Request, Response } from "express";
import { BUCKETS } from "../../config/s3.minio";
import { showError, sendResponse } from "../../utils/operations";
import { ErrorResponse } from "../../types/response.types";
import { uploadMediaToS3 } from "../../services/media.services";

export async function handleMediaUpload(req: Request, resp: Response){

    if(!req.file) {
        const error: ErrorResponse = {message: "File is required", state: "Failed", type: "input_error"};
        showError(error, resp);
        return;
    }

    const [fileKey, error] = await uploadMediaToS3(req.file, BUCKETS.MEDIA);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", fileKey: fileKey};
    sendResponse(responseData, {}, 200, resp);
};