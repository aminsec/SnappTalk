import { Socket } from 'socket.io-client';
import { MessageType } from './chat.types';

export type SocketStatus = 'disconnected' | 'authenticated' | 'auth_error';

export interface SocketContextValue {
  socket: Socket | null;
  status: SocketStatus;
}

export interface NewPvConversationPayload {
  message_text: string;
  new_user_id: string;
  date?: string | Date;
  track_id: string;
  message_type: MessageType;
  attachment_key?: string;
}

export interface PvConversationDeletePayload {
  conversation_id: string;
  delete_for: 'me' | 'all';
}

export interface MessageSendPayload {
  message_text: string;
  conversation_id: string;
  track_id: string;
  message_type: MessageType;
  attachment_key?: string;
  replied_to?: string;
}

export interface MessageReplyPayload {
  conversation_id: string;
  message_text: string;
  reply_to: string;
  track_id: string;
  message_type: MessageType;
  attachment_key?: string;
}

export interface MessageSeenPayload {
  conversation_id: string;
  message_id: string;
}

export interface MessageEditPayload {
  message_id: string;
  new_message: string;
}

export interface MessageDeletePayload {
  message_id: string;
}

