import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import accountRoutes from "./routes/user";
import validateJWT from "./middlewares/jwt";
import helmet from "helmet";

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use(helmet());
app.use(bodyParser.json({ limit: "5mb" })); // Increasing body size limit
app.use(cookieParser()); // Parsing cookies
app.use("/auth", authRoutes);
app.use("/user", validateJWT);
app.use("/user", accountRoutes);

export default app;