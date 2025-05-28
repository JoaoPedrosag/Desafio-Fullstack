export const CLIENT_EVENTS = {
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  SEND_MESSAGE: 'sendMessage',
  USER_TYPING: 'userTyping',
} as const;

export const SERVER_EVENTS = {
  ONLINE_USERS: 'onlineUsers',
  USER_IS_TYPING: 'userIsTyping',
  USER_LEFT_ROOM: 'userLeftRoom',
  ONLINE_COUNT: 'onlineCount',
  NEW_MESSAGE: 'newMessage',
  ROOM_NOTIFICATION: 'roomNotification',
  NEW_ROOM: 'newRoom',
  MESSAGE_EDITED: 'messageEdited',
  MESSAGE_DELETED: 'messageDeleted',
} as const;

export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];
