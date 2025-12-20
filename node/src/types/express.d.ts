import { Request } from 'express';
import { ProtectedUserInfo } from './user.types';
import { Socket } from 'socket.io';

declare module 'express-serve-static-core' {
  interface Request {
    userInfo: ProtectedUserInfo ; 
  }
};

declare module 'socket.io' {
  interface Socket {
    userInfo: ProtectedUserInfo;
  }
};