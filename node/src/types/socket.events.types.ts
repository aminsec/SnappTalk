//Every type that ends with EVT means Event Type
export interface NewPvConversationEVT {
    message_text: string,
    new_user_id: string,
    date?: Date,
    track_id: string
};

export interface pvConversationDeleteEVT {
    conversation_id: string,
    delete_for: "me" | "all"
};

export interface MessageSendEVT {
    message_text: string,
    conversation_id: string,
    track_id: string
};

export interface MessageSeenEVT {
    conversation_id: string,
    message_id: string
};

export interface MessageEditEVT {
    message_id: string
    new_message: string
};

export interface MessageDeleteEVT {
    message_id: string
};