import { showError, sendResponse } from "../../utils/operations";
import { Request, Response } from "express";
import { getConversationMessagesByLimitedDate } from "../../services/messages.services";
import { ObjectId } from "mongodb";
import { Message } from "../../types/messages.types";
import { ErrorResponse } from "../../types/response.types";
import { checkUserHasAccessToConversation } from "../../utils/validate";
import { Conversation } from "../../types/conversation.types";

export async function showUserConversationMessages(req: Request, resp: Response) {
    const { conversationId } = req.params;
    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);
    const { userInfo } = req;

    //Checking if user has access to the conversation
    const [conversation, err]: [Conversation | null, ErrorResponse | null] = await checkUserHasAccessToConversation(new ObjectId(conversationId), userInfo.id);
    
    //If user had not access to conversation, a not found error will be shown
    if(err){
        showError(err, resp);
        return;
    }

    const messagesDeletedSinceForUser = conversation?.deleted_for?.[userInfo.id]; // This can be null because for groups 
    const [messages, error]: [Message[] | null, ErrorResponse | null] = await getConversationMessagesByLimitedDate(new ObjectId(conversationId), messagesDeletedSinceForUser || "0", limit, offset);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", messages: messages};
    sendResponse(responseData, {}, 200, resp);
};