import { Request, Response } from "express";
import { BUCKETS } from "../../config/s3.minio";
import { showError, sendResponse } from "../../utils/operations";
import { ErrorResponse } from "../../types/response.types";
import { generatePreSignedURL, uploadMediaToS3 } from "../../services/media.services";
import { getMessageByAttachmentKey } from "../../services/messages.services";
import { checkUserHasAccessToConversation } from "../../utils/validate";

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

export async function handleMediaDownload(req: Request, resp: Response){
    const { file_key } = req.body;
    const { userInfo } = req;

    const [fileMessage, error] = await getMessageByAttachmentKey(file_key);
    if(error){
        showError(error, resp);
        return;
    }

    if(!fileMessage){
        const error: ErrorResponse = {message: "File not found", state: "failed", type: "not_found"};
        showError(error, resp);
        return;
    }

    //Checking user if has access to file, by matching conversation_id of message with user conversations
    const [userHasAccess, err] = await checkUserHasAccessToConversation(fileMessage.conversation_id, userInfo.id);
    if(err){
        showError(err, resp);
        return;
    }

    if(!userHasAccess){
        const error: ErrorResponse = {message: "Access denied", state: "failed", type: "access_denied"};
        showError(error, resp);
        return;
    }

    const [preSignedURL, signError] = await generatePreSignedURL(BUCKETS.MEDIA, file_key);
    if(signError){
        showError(signError, resp);
        return;
    }

    const responseData = {state: "success", download_url: preSignedURL};
    sendResponse(responseData, {}, 200, resp);
};