import { Types } from "mongoose";

export type MessageTypes = "text" | "image" | "audio" | "video" | "document" | "location" | "sticker" | "gif"

export interface Message {
    sender: Types.ObjectId;
    type: MessageTypes;
    conversation_id: Types.ObjectId;
    attachment_url: string;
    content: string;
    seen_by: Map<string, Date>;
    edited: boolean;
    edited_at?: Date;
    created_at: Date;
    replied_to: Types.ObjectId | null;
    deleted_for: Types.ObjectId[];
}

export interface InsertMessage {
    sender: Types.ObjectId,
    type: MessageTypes,
    conversation_id: Types.ObjectId,
    attachments: string[],
    content: string,
    replied_to: Types.ObjectId | null,
    deleted_for: Types.ObjectId[]
};

export interface DBMessageType {
    sender: Types.ObjectId;
    type: MessageTypes;
    conversation_id: Types.ObjectId;
    attachment_url: string;
    content: string;
    seen_by: Map<string, Date>;
    edited: boolean;
    edited_at?: Date;
    created_at: Date;
    replied_to: Types.ObjectId | null;
    deleted_for: Types.ObjectId[];
}