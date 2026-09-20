import { Resend } from 'resend';

const emailClient = new Resend(process.env.RESEND_API_KEY);

export default emailClient;