export const SOCKET_EVENTS = {
  AUTH: 'auth',
  AUTH_OK: 'auth:ok',
  AUTH_ERROR: 'auth:error',

  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  CONVERSATION_DELETE: 'conversation:delete',
  CONVERSATION_DELETED: 'conversation:deleted',

  MESSAGE_SEND: 'message:send',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_NEW: 'message:new',
  NEW_PV_CONVERSATION: 'new_pv_conversation',

  MESSAGE_SEEN: 'message:seen',
  MESSAGE_SEEN_UPDATE: 'message:seen_update',

  MESSAGE_EDIT: 'message:edit',
  MESSAGE_UPDATED: 'message:updated',

  MESSAGE_DELETE: 'message:delete',
  MESSAGE_DELETED: 'message:deleted',
};
