export interface sendEmailJob {
    to: string;
    subject: string;
    template: string;
    parameters: Record<string, string>;
}