import { showError, sendResponse, filterMessagesDeletedForUser } from "../../utils/operations";
import { Request, Response } from "express";
import { getConversationMessagesByLimitedDate } from "../../services/messages.services";
import { Types } from "mongoose";
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
    const [conversation, err]: [Conversation | null, ErrorResponse | null] = await checkUserHasAccessToConversation(new Types.ObjectId(conversationId), userInfo._id.toString());

    //If user had not access to conversation, a not found error will be shown
    if(err){
        showError(err, resp);
        return;
    }

    const messagesDeletedSinceForUser = conversation?.deleted_for?.[userInfo._id.toString()]?.toString(); // This can be null because of groups
    const [messages, error]: [Message[] | null, ErrorResponse | null] = await getConversationMessagesByLimitedDate(new Types.ObjectId(conversationId), messagesDeletedSinceForUser || "0", limit, offset, userInfo._id);
    if(error){
        showError(error, resp);
        return;
    }

    //Filtering messages that are deleted for the user
    const filteredMessages = await filterMessagesDeletedForUser(messages || [], userInfo._id);
    const responseData = {state: "success", messages: filteredMessages};
    sendResponse(responseData, {}, 200, resp);
};
