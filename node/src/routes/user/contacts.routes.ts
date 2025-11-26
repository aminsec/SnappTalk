import express from "express";
import { check } from 'express-validator';
import * as accountContactsController from "../../controllers/user/contacts.controller";
const router = express.Router();

router.get("/contacts", accountContactsController.showUserContacts);

export default router;