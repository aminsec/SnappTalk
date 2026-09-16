import amqp, { Channel, ChannelModel } from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const RECONNECT_DELAY_MS = 5000;

if (!RABBITMQ_URL) {
  throw new Error("RABBITMQ_URL is not defined");
}

let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let connecting: Promise<void> | null = null;

export async function connectRabbitMQ(): Promise<void> {
  // Prevent parallel connect attempts if called concurrently
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      connection = await amqp.connect(RABBITMQ_URL!);
      channel = await connection.createChannel();

      connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
      });

      connection.on("close", () => {
        console.warn("RabbitMQ connection closed, reconnecting...");
        channel = null;
        connection = null;
        scheduleReconnect();
      });

      channel.on("error", (err) => {
        console.error("RabbitMQ channel error:", err);
      });

      console.log("Connected to RabbitMQ");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      connection = null;
      channel = null;
      throw error;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

function scheduleReconnect(): void {
  setTimeout(() => {
    connectRabbitMQ().catch(() => {
      // connectRabbitMQ already logs; scheduleReconnect() will be
      // triggered again by the next "close" event if this attempt fails
    });
  }, RECONNECT_DELAY_MS);
}

export function getRabbitChannel(): Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }
  return channel;
}

export async function closeRabbitMQ(): Promise<void> {
  await channel?.close();
  await connection?.close();
  channel = null;
  connection = null;
}