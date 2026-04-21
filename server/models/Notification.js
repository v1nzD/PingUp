import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: String, // Clerk userId
      required: true,
    },
    sender: {
      type: String, // Clerk userId of whoever liked/commented
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment"],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    comment: {
      type: String, // stores the comment text for quick preview
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
