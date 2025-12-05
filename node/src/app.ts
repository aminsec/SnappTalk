import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth/auth.routes";
import membersRoutes from "./routes/members/info.routes";
import accountRoutes from "./routes/user/info.routes";
import accountConversationsRoutes from "./routes/user/conversations.routes";
import accountMessagesRoutes from "./routes/user/messages.routes";
import validateJWT from "./middlewares/jwt";
import helmet from "helmet";
import { rateLimit } from 'express-rate-limit'

//Rate limit config 
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 100 requests per `windowMs`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

//Configs
app.use(limiter);
app.use(helmet());
app.use(bodyParser.json({ limit: "5mb" })); // Increasing body size limit
app.use(cookieParser()); // Parsing cookies

//Routes
app.use("/members", membersRoutes);
app.use("/auth", authRoutes);
app.use("/user", validateJWT);
app.use("/user", accountRoutes);
app.use("/user/conversations", accountConversationsRoutes);
app.use("/user/messages", accountMessagesRoutes);

export default app;