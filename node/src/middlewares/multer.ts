import multer from "multer";
import crypto from "crypto";

export const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "/up/node/uploads/");
    },

    filename(req, file, cb) {
      const filename = `${crypto.randomUUID()}`;
      cb(null, filename);
    },
  }),

  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});