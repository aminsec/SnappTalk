import { EmailTemplate } from "./templates";

export interface sendEmailMessage {
    to: string;
    subject: string;
    template: EmailTemplate;
    parameters: Record<string, string>;
}