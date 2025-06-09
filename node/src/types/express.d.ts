import { Request } from 'express';
import { ProtectedUserInfo } from './user.types';

declare module 'express-serve-static-core' {
  interface Request {
    userInfo: ProtectedUserInfo ; 
  }
};