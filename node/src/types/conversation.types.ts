import { Types } from "mongoose";
import { Message } from "./messages.types"

export interface Conversation {
    _id: Types.ObjectId,
    type: "group" | "pv",
    group_name: string | null,
    group_avatar: string | null,
    members: Types.ObjectId[],
    contact_info?: any,
    last_message_id: Record<string, Types.ObjectId>,
    last_message?:  Message | null,
    deleted_for: Record<string, Date>,
    created_at: Date,
    unread_messages_count?: Number
};

export interface DBConversationType {
    type: "group" | "pv";
    group_name: string | null;
    group_avatar: string | null;
    members: Types.ObjectId[];
    last_message_id: Record<string, Types.ObjectId>;
    deleted_for: Record<string, Date>;
    created_at: Date;
};