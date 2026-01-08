export const SOCKET_EVENTS = {
  AUTH: 'auth',
  AUTH_OK: 'auth:ok',
  AUTH_ERROR: 'auth:error',

  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  CONVERSATION_PV_DELETE: 'conversation:pv:delete',
  CONVERSATION_PV_DELETE_ACK: 'conversation:pv:delete:ack',
  CONVERSATION_PV_DELETE_ERROR: 'conversation:pv:delete:error',
  CONVERSATION_PV_DELETED: 'conversation:pv:deleted',

  MESSAGE_SEND: 'message:send',
  MESSAGE_SEND_REPLY: 'message:send:reply',
  MESSAGE_SEND_REPLY_ACK: 'message:send:reply:ack',
  MESSAGE_SEND_REPLY_ERROR: 'message:send:reply:error',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_SEND_ACK: 'message:send:ack',
  MESSAGE_NEW: 'message:new',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_RECEIVE_REPLY: 'message:receive:reply',
  SEEN_SEND: 'seen',
  MESSAGE_SEEN: 'message:seen',
  NEW_PV_CONVERSATION: 'new_pv_conversation',

  MESSAGE_EDIT: 'message:edit',
  MESSAGE_EDITED: 'message:edited',

  MESSAGE_DELETE: 'message:delete',
  MESSAGE_DELETED: 'message:deleted',
};
