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
  MESSAGE_SENT: 'message:sent',
  MESSAGE_SEND_ACK: 'message:send:ack',
  MESSAGE_NEW: 'message:new',
  MESSAGE_RECEIVE: 'message:receive',
  SEEN_SEND: 'seen',
  MESSAGE_SEEN: 'message:seen',
  NEW_PV_CONVERSATION: 'new_pv_conversation',

  MESSAGE_EDIT: 'message:edit',
  MESSAGE_EDITED: 'message:edited',

  MESSAGE_DELETE: 'message:delete',
  MESSAGE_DELETED: 'message:deleted',
};
