import resend from "../config/resender";
import { renderEmailTemplate } from "../utils/operations";
import type { ErrorResponse } from "../types/response.types";

export async function sendEmail(to: string, subject: string, templateName: string, variables: Record<string, string>): Promise<[true | false | null, null | ErrorResponse]> {
    try {
        const html = await renderEmailTemplate(
            templateName,
            variables
        );
    
        const { data, error } = await resend.emails.send({
            from: "SnappTalk <onboarding@uptalk.ir>",
            to,
            subject,
            html,
        });
    
        if (error) {
            console.log(error);
            const errorMessage: ErrorResponse = {state: "failed", message: "Coudn't send email", type: "system_error"};
            return [null, errorMessage]
        }
    
        return [true, null];

    } catch (error) {
        console.log(error);
        const message: ErrorResponse = {state: "failed", message: "Coudn't send email", type: "system_error"};
        return [null, message];
    }
};