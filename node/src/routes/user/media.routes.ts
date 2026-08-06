import express from "express";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../../middlewares/errors";
import { upload } from "../../middlewares/multer";
import { handleMediaUpload } from "../../controllers/user/media.controller";

const router = express.Router();

router.post("/upload", upload.single("file"), handleMediaUpload);

export default router;