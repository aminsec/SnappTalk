import { EmailTemplate } from "./templates";

export interface sendEmailJob {
    to: string;
    subject: string;
    template: EmailTemplate;
    parameters: Record<string, string>;
}