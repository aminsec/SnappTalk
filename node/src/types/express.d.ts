import { Request } from 'express';
import { Token } from './user.types';

declare module 'express-serve-static-core' {
  interface Request {
    userInfo: Token ; 
  }
};