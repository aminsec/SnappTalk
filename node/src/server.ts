import { connectToSnappTalkDB } from "./config/database";
import { initSocket } from "./config/init.websocket";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKETS } from "./config/s3.minio";
import http from "http";
import app from "./app";

const PORT = Number(process.env.APP_PORT) || 2020;
const server = http.createServer(app);

async function start() {
  try {
    //Conneting to servers
    await connectToSnappTalkDB();
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKETS.PROFILE_PICS }));
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKETS.MEDIA }));
    console.log("Connected to MinIO S3");

    initSocket(server);
    server.listen(PORT, () => console.log(`SnappTalk app listening on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start:", error);
    process.exit(1);
  }
}

start();
