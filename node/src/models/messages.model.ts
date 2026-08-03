import mongoose, { Schema, Model, Types } from "mongoose";

export type MessageType = "text" | "image" | "audio" | "video" | "file" | "location" | "contact" | "event" | "system";

export interface IMessage {
    sender: Types.ObjectId;
    type: MessageType;
    conversation_id: Types.ObjectId;
    attachments: string[];
    content: string;
    seen_by: Map<string, Date>;
    edited: boolean;
    edited_at?: Date;
    created_at: Date;
    replied_to: Types.ObjectId | null;
    deleted_for: Types.ObjectId[];
}

const messageSchema = new Schema<IMessage>({
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    conversation_id: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    attachments: { type: [String], default: [] },
    content: { type: String, required: true },
    seen_by: { type: Map, of: Date, default: {} },
    edited: { type: Boolean, default: false },
    edited_at: { type: Date },
    created_at: { type: Date, default: Date.now },
    replied_to: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    deleted_for: { type: [Schema.Types.ObjectId], default: [] }
});

export const Message: Model<IMessage> = mongoose.model<IMessage>("Message", messageSchema);