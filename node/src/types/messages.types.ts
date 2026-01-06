import { ObjectId } from "mongodb";

export interface Message {
    _id: ObjectId,
    sender: ObjectId,
    type: "text" | "image" | "audio" | "video" | "file" | "location" | "contact" | "event" | "system",
    conversation_id: ObjectId,
    attachments: string[],
    content: string,
    seen_by: Object,
    edited: Boolean,
    edited_at: Date
    created_at: string
};