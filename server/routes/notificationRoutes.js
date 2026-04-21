import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

// GET  /api/notifications        — fetch all notifications for logged-in user
notificationRouter.get("/", protect, getNotifications);

// PATCH /api/notifications/:id/read  — mark one notification as read
notificationRouter.patch("/:id/read", protect, markNotificationRead);

// PATCH /api/notifications/read-all  — mark all as read
notificationRouter.patch("/read-all", protect, markAllNotificationsRead);

export default notificationRouter;
