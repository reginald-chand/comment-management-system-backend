import { commentController } from "../controllers/comment/comment.controller.mjs";
import { csrfController } from "../controllers/auth/csrf.controller.mjs";
import express from "express";
import { userVerificationMiddleware } from "../middlewares/user.verification.middleware.mjs";

export const routes = express.Router();

routes.post("/post/comment", userVerificationMiddleware, commentController);

routes.get("/auth/csrf-token", csrfController);
