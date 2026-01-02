//Every type that ends with EVT means Event Type
export interface NewPvConversationEVT {
    message_text: string,
    new_user_id: string,
    date?: Date
}