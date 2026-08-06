import express from "express";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../../middlewares/errors";
import { upload } from "../../middlewares/multer";

const router = express.Router();

router.post("/upload", upload.single("file"), (req, resp) => {
    console.log(req.file);
});

export default router;