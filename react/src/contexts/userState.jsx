import { createContext } from 'react';

export const userStateContext = createContext({
    userState: 0,
    setUserState: () => {}
});