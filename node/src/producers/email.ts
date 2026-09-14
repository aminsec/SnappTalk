import { getRabbitChannel } from "../config/rabitmq";
import { sendEmailJob } from "../types/jobs.types";
import { ErrorResponse } from "../types/response.types";

export async function queueEmail(job: sendEmailJob): Promise<[boolean | null, ErrorResponse | null]> {
    try {
        let emailQueue = "email_queue";
        const EMAIL_DLQ = "email_queue.dlq";

        const channel = getRabbitChannel();
        await channel.assertQueue(emailQueue, { durable: true, arguments: {
            "x-queue-type": "quorum",
            "x-delivery-limit": 3,
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": EMAIL_DLQ,
        }});
    
        channel.sendToQueue(emailQueue, Buffer.from(JSON.stringify(job)), {
            persistent: true, // survive broker restart
        });
    
        return [true, null];

    } catch (error) {
        console.error("Error queueing email job:", error);
        const err: ErrorResponse = {message: "Failed to queue email", state: "failed", type: "system_error",};
        return [null, err];
    }
};