export const globalReg = {
    username: /^[a-zA-Z0-9_]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/,
    conversationId: /^[0-9a-zA-Z]+$/,
    userid: /^[a-zA-Z0-9_]+$/
};