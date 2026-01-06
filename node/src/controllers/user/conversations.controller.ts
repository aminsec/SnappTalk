import { Request, Response } from "express";
import { getUserConversations, hardDeleteConversation, softDeleteConversation } from "../../services/conversations.services";
import { showError, sendResponse } from "../../utils/operations";
import { ObjectId } from "mongodb";
import { checkUserHasAccessToConversation } from "../../utils/validate";
import { ErrorResponse } from "../../types/response.types";
import { Conversation } from "../../types/conversation.types";

export async function showUserConversations(req: Request, resp: Response) {
    const { userInfo } = req;
    const [conversations, error] = await getUserConversations(userInfo);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", conversations: conversations};
    sendResponse(responseData, {}, 200, resp);
};

export async function deleteConversation(req: Request, resp: Response) {
    const { userInfo } = req;
    const { convId } = req.params;
    const for_param = req.query.for;

    //Checking if user has access to the conversation
    const [conversation, err]: [Conversation | null, ErrorResponse | null] = await checkUserHasAccessToConversation(new ObjectId(convId), userInfo.id);

    //If user had not access to conversation, a not found error will be shown
    if(err){
        showError(err, resp);
        return;
    }

    //User can not delete group conversations
    if(conversation?.type === "pv"){
        if(for_param === "me"){
            const [deleteResult, error] = await softDeleteConversation(userInfo, new ObjectId(convId));
            if(error){
                showError(error, resp);
                return;
            }
    
            const responseData = {state: "success", message: "Conversation deleted successfully"};
            sendResponse(responseData, {}, 200, resp);
            return;
    
        }else if(for_param === "all"){
            const [deleteResult, error] = await hardDeleteConversation(new ObjectId(convId)); 
            if(error){
                showError(error, resp);
                return;
            }

            if(deleteResult === true){
                const responseData = {state: "success", message: "Conversation deleted successfully"};
                sendResponse(responseData, {}, 200, resp);
                return;

            }else{
                const err: ErrorResponse = { state: "failed", message: "Couldn't delete conversation", type: "system_error"};
                showError(err, resp);
                return;
            }
        }

    }else{
        const err: ErrorResponse = { state: "failed", message: "You can not delete this conversation", type: "input_error"};
        showError(err, resp);
        return;
    }
};