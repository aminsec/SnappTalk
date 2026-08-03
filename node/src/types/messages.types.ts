import { Types } from "mongoose";

export interface Message {
    _id: Types.ObjectId,
    sender: Types.ObjectId,
    type: "text" | "image" | "audio" | "video" | "file" | "location" | "contact" | "event" | "system",
    conversation_id: Types.ObjectId,
    attachments: string[],
    content: string,
    seen_by: Object,
    edited: Boolean,
    edited_at?: Date,
    created_at: Date,
    replied_to: Object | null,
    deleted_for: Types.ObjectId[]
};

export interface InsertMessage {
    sender: Types.ObjectId,
    type: "text" | "image" | "audio" | "video" | "file" | "location" | "contact" | "event" | "system",
    conversation_id: Types.ObjectId,
    attachments: string[],
    content: string,
    replied_to: Types.ObjectId | null,
    deleted_for: Types.ObjectId[]
};