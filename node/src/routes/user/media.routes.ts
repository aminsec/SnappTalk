import express from "express";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../../middlewares/errors";
import { upload } from "../../middlewares/multer";
import { handleMediaUpload, handleMediaDownload } from "../../controllers/user/media.controller";

const router = express.Router();

router.post("/upload", upload.single("file"), handleMediaUpload);
router .post("/download", [
    check("file_key")
    .isString().withMessage("Invalid input type")
    .notEmpty().withMessage("file_key is required."),
    checkThereIsAnyError
], handleMediaDownload)

export default router;