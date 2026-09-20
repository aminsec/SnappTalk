import "./config/resender";
import { connectRabbitMQ } from "./config/rabitmq";
import { startEmailConsumer } from "./workers/email";

await connectRabbitMQ();
await startEmailConsumer();