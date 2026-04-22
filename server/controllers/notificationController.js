import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.auth();

    const notifications = await Notification.find({ recipient: userId })
      .populate("post", "content image_urls") // only grab what the frontend needs
      .sort({ createdAt: -1 })
      .limit(50);

    // Manually attach sender profile
    const notificationsWithSender = await Promise.all(
      notifications.map(async (notification) => {
        const sender = await User.findById(notification.sender).select(
          "full_name username profile_picture",
        );
        return {
          ...notification.toObject(),
          sender,
        };
      }),
    );

    res.json({
      success: true,
      notifications: notificationsWithSender,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Mark a single notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.json({ success: false, message: "Notification not found" });
    }

    // Make sure the notification belongs to the current user
    if (notification.recipient !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const { userId } = req.auth();

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true },
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};
