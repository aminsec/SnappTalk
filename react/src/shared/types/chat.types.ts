import { MemberInfo } from './user.types';

export type MessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'location'
  | 'sticker'
  | 'gif';

export interface ReplyPreview {
  id?: string;
  _id?: string;
  messageId?: string;
  message_id?: string;
  senderName?: string;
  sender_name?: string;
  sender?: any;
  sender_id?: string;
  sender_info?: {
    username?: string;
    profile_pic?: string;
    _id?: string;
    id?: string;
  };
  sender_username?: string;
  username?: string;
  text?: string;
  content?: string;
  type?: MessageType;
  attachment_key?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  [key: string]: any;
}

export interface Message {
  _id?: string;
  id?: string;
  sender: string | { _id: string; username?: string; profile_pic?: string };
  conversation_id: string;
  type: MessageType;
  content?: string;
  text?: string;
  attachment_key?: string;
  seen_by?: Record<string, string | Date> | Map<string, string | Date>;
  is_seen?: boolean;
  edited?: boolean;
  edited_at?: string | Date;
  created_at?: string | Date;
  when?: string | number | Date;
  replied_to?: string | null | ReplyPreview;
  reply_preview?: ReplyPreview;
  track_id?: string;
  status?: 'pending' | 'sent' | 'delivered' | 'seen' | 'failed';
  error?: string;
}

export interface Conversation {
  _id: string;
  id?: string;
  type: 'pv' | 'group';
  group_name?: string | null;
  group_avatar?: string | null;
  members: string[];
  contact_info?: MemberInfo;
  last_message_id?: Record<string, string>;
  last_message?: Message | null;
  created_at?: string | Date;
  unread_messages_count?: number;
}
