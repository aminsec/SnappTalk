import express from "express";
import { check } from 'express-validator';
import { checkIsThereAnyError } from "../../middlewares/errors";
const router = express.Router();

router.get("/contacts", accountContactsController.showUserContacts);