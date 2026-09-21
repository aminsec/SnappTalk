import mongoose, { Schema, Model } from "mongoose";
import { Message } from "../types/messages.types";

const messageSchema = new Schema<Message>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    type: {
        type: String,
        required: true
    },

    conversation_id: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },

    attachment_key: {
        type: String,
        allowNull: true,
        default: null
    },

    content: {
        type: String,
        required: true
    },

    seen_by: {
        type: Map,
        of: Date,
        default: {}
    },

    edited: {
        type: Boolean,
        default: false
    },

    edited_at: {
        type: Date
    },

    created_at: {
        type: Date,
        default: Date.now
    },

    replied_to: {
        type: Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },

    deleted_for: {
        type: [Schema.Types.ObjectId],
        default: []
    }
});

// Messages of a conversation, newest first
messageSchema.index({
    conversation_id: 1,
    created_at: -1
});

messageSchema.index({
    created_at: -1
});

messageSchema.index(
    { attachment_key: 1 }, 
    {
        unique: true,
        partialFilterExpression: {
            attachment_key: { $type: "string" }
        }
    }
); 

export const MessageModel: Model<Message> = mongoose.model<Message>("Message", messageSchema);