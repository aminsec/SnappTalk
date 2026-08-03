import { Socket } from "socket.io";
import { Conversation as ConversationModel } from "../models/conversatations.model";
import { Types } from "mongoose";
import { ErrorResponse } from "../types/response.types";

export async function connectUserToRooms(socket: Socket): Promise<[true | false | null, ErrorResponse | null]> {
    try {
        const userConversations = await ConversationModel.find({members: {$in: [new Types.ObjectId(socket.userInfo.id)]}}).lean();
        if(userConversations){
            for(let conversation of userConversations){
                socket.join(conversation._id.toString());
            }
        }

        //Removing socket's own room
        socket.rooms.delete(socket.id);

        return [true, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function sendUserStatusToRooms(socket: Socket, status: string): Promise<void> {
    for(let rooms of socket.rooms){
        socket.to(rooms).emit(`status:${status}`, {user_id: socket.userInfo.id});
    }

    return;
};