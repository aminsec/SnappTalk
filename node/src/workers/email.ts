import { getRabbitChannel } from "../config/rabitmq";
import { sendEmailMessage } from "../types/brokers.messages.types";
import { sendEmail } from "../providers/email";
import { EMAIL_QUEUE, EMAIL_DLQ } from "../constants/queue";

export async function startEmailConsumer(): Promise<void> {
  const channel = getRabbitChannel();
  await channel.assertQueue(EMAIL_QUEUE, { durable: true, arguments: {
    "x-queue-type": "quorum",
    "x-delivery-limit": 3,
    "x-dead-letter-exchange": "",
    "x-dead-letter-routing-key": EMAIL_DLQ,
  }});

  // Don't let one consumer hog many unacked messages
  channel.prefetch(5);

  channel.consume(EMAIL_QUEUE, async (msg) => {
    if (!msg) return;
  
    const job: sendEmailMessage = JSON.parse(msg.content.toString());
  
    try {
      const [result, error] = await sendEmail(job.to, job.subject, job.template, job.parameters);
      if (error) {
        throw new Error(error.message);
      }
      channel.ack(msg);
    } catch (error) {
      console.error("Email send failed, will retry if under limit:", error);
      channel.nack(msg, false, true); // requeueing
    }
  });
};