import { ObjectId } from "mongodb";

export interface Conversation {
    _id: ObjectId,
    type: "group" | "pv",
    group_name: string | null,
    group_avatar: string | null,
    members?: string[],
    contact_info?: any,
    last_message_id: ObjectId,
    created_at: string
};