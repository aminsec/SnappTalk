import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth/auth.routes";
import accountRoutes from "./routes/user/info.routes";
import accountContactsRoutes from "./routes/user/contacts.routes";
import validateJWT from "./middlewares/jwt";
import helmet from "helmet";
import { rateLimit } from 'express-rate-limit'

//Rate limit config 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `windowMs`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use(limiter);
app.use(helmet());
app.use(bodyParser.json({ limit: "5mb" })); // Increasing body size limit
app.use(cookieParser()); // Parsing cookies
app.use("/auth", authRoutes);
app.use("/user", validateJWT);
app.use("/user", accountRoutes);
app.use("/user", accountContactsRoutes);

export default app;