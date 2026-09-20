import { getRabbitChannel } from "../config/rabitmq";
import { ErrorResponse } from "../types/response.types";

export async function queueMessage(queue: string, message: any): Promise<[boolean, null] | [null, ErrorResponse]> {
    try {
        const channel = getRabbitChannel();
        await channel.assertQueue(queue, { durable: true, arguments: {
            "x-queue-type": "quorum",
            "x-delivery-limit": 3,
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": `${queue}.dlq`,
        }});
    
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true, // survive broker restart
        });
    
        return [true, null];

    } catch (error) {
        console.error(`Error queueing message to ${queue}:`, error);
        const err: ErrorResponse = {message: `Failed to queue message to ${queue}`, state: "failed", type: "system_error",};
        return [null, err];
    }
};