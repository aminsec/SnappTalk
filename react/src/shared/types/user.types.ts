export type UserStatus = 'online' | 'offline';

export interface User {
  _id: string;
  id: string;
  email: string;
  username: string;
  profile_pic: string;
  role?: string;
  joined_at?: string | Date;
  bio?: string;
  status?: UserStatus;
  verified?: boolean;
}

export interface MemberInfo {
  _id: string;
  id?: string;
  email?: string;
  username: string;
  profile_pic: string;
  bio?: string;
  status?: UserStatus;
  joined_at?: string | Date;
  role?: string;
}

