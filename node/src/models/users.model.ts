import mongoose, { Schema, Model } from "mongoose";
import { DBUserType } from "../types/user.types";

const userSchema = new Schema<DBUserType>({
    email: {
        type: String,
        required: true,
        unique: true
    },

    username: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    profile_pic: {
        type: String,
        required: true
    },

    role: {
        type: String,
        required: true
    },

    joined_at: {
        type: Date,
        required: true
    },

    bio: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["online", "offline"],
        default: "online"
    },

    deleted_account: {
        type: Boolean,
        default: false
    },

    verified: {
        type: Boolean,
        default: false
    },

    email_verify_token: {
        type: String,
        default: null
    },

    email_verify_token_expires_at: {
        type: Date
    },

    email_verify_token_requested_at: {
        type: Date
    },

    forgot_password_token: {
        type: String,
        default: null
    },

    forgot_password_token_expires_at: {
        type: Date,
        default: null
    },

    forgot_password_token_requested_at: {
        type: Date
    }
});

// Unique index only for documents that have a string token
userSchema.index(
    { email_verify_token: 1 },
    {
        unique: true,
        partialFilterExpression: {
            email_verify_token: { $type: "string" }
        }
    }
);

userSchema.index(
    { forgot_password_token: 1 },
    {
        unique: true,
        partialFilterExpression: {
            forgot_password_token: { $type: "string" }
        }
    }
);

// Delete unverified users after 24 hours
userSchema.index(
    { joined_at: 1 },
    {
        expireAfterSeconds: 60 * 60 * 24,
        partialFilterExpression: {
            verified: false
        }
    }
);

export const User: Model<DBUserType> = mongoose.model<DBUserType>("User", userSchema);