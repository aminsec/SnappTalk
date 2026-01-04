import { Socket } from "socket.io";
import { getConversationsCollection } from "../models/conversatations.model";
import { ObjectId } from "mongodb";
import { ErrorResponse } from "../types/response.types";

export async function connectUserToRooms(socket: Socket): Promise<[true | false | null, ErrorResponse | null]> {
    try {
        const conversationsCollection  = await getConversationsCollection();
        const userConversations = await conversationsCollection.find({members: {$in: [new ObjectId(socket.userInfo.id)]}}).toArray();
        if(userConversations){
            for(let conversation of userConversations){
                socket.join(conversation._id.toString());
            }
        }

        return [true, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};