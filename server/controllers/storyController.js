import fs from "fs";
import imageKit from "../configs/imageKit";
import Story from "../models/Story";
import User from "../models/User";
import { inngest } from "../inngest/index.js";

// Add user story
export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, media_type, background_color } = req.body;
    const media = req.file;

    let media_url = "";
    // upload media to imagekit
    if (media_type === "image" || media_type === "video") {
      const fileBuffer = fs.readFileSync(media.path);

      const response = await imageKit.upload({
        file: fileBuffer,
        fileName: media.originalName,
      });
      media_url = response.url;
    }
    // create story
    const story = await Story.create({
      user: userId,
      content,
      media_url,
      media_type,
      background_color,
    });

    // schedule story deletion after 24 hours
    await inngest.send(({
        name: 'app/story-delete',
        data: {storyId: story._id}
    }))

    res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Get user stories
export const getStories = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    // User connections and followings
    const userIds = [userId, ...user.connections, ...user.following];

    const stories = await Story.find({
      user: { $in: userIds },
    })
      .populate("user")
      .sort({ createdAt: -1 });
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
