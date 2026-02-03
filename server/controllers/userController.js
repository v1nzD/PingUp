import User from "../models/User.js";
import Connection from "../models/Connection.js";
import fs from "fs";
import imageKit from "../configs/imageKit.js";

// Get user data using userId
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User found", user });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Update user data using userId
export const updateUserData = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { username, bio, location, full_name } = req.body;
    const tempUser = await User.findById(userId);

    !username && (username = tempUser.username);

    if (tempUser.username !== username) {
      const user = User.findOne({ username });
      if (user) {
        // dont change username if already taken
        username = tempUser.username;
        return res
          .status(400)
          .json({ success: false, message: "Username already taken" });
      }
    }

    const updatedData = {
      username,
      bio,
      location,
      full_name,
    };

    const profile = req.files.profile && req.files.profile[0];
    const cover = req.files.cover && req.files.cover[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imageKit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "512" },
        ],
      });
      updatedData.profile_picture = url;
    }

    if (cover) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imageKit.upload({
        file: buffer,
        fileName: cover.originalname,
      });

      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
      updatedData.cover_picture = url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    res.json({ success: true, message: "User updated", data: user });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Find users by username, email, location or name
export const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { input } = req.body;

    const allUsers = await User.find({
      $or: [
        { username: new RegExp(input, "i") },
        { email: new RegExp(input, "i") },
        { full_name: new RegExp(input, "i") },
        { location: new RegExp(input, "i") },
      ],
    });
    // exclude the current user from the results
    const filteredUsers = allUsers.filter((user) => user._id !== userId);
    res.json({ success: true, message: "Users found", data: filteredUsers });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Follow a user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.body;

    const user = await User.findById(userId);

    // user already following the user
    if (user.following.includes(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Already following the user" });
    }

    // add user to following list
    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    // add user to followers list
    toUser.followers.push(userId);
    await toUser.save();

    res.json({ success: true, message: "User followed successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.body;

    const user = await User.findById(userId);

    // remove user from followers list
    user.following = user.following.filter((user) => user !== id);
    await user.save();

    // remove user from following list
    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter((user) => user !== id);
    await toUser.save();

    res.json({ success: true, message: "User unfollowed successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Send connection request to a user
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.body;

    // Check if user has sent more than 20 connection requests in the last 24 hours
    const last24hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionRequests = await Connection.find({
      from_user_id: userId,
      createdAt: { $gte: last24hours },
    });
    if (connectionRequests.length >= 20) {
      return res.status(400).json({
        success: false,
        message:
          "You have reached the limit of 20 connection requests in the last 24 hours",
      });
    }

    // Check if users are already connected
    const connection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId },
      ],
    });

    if (!connection) {
      await Connection.create({ from_user_id: userId, to_user_id: id });
      return res.json({ success: true, message: "Connection request sent" });
      
    } else if (connection && connection.status === "accepted") {
      return res
        .status(400)
        .json({ success: false, message: "You are already connected" });
    }
    return res
      .status(400)
      .json({ success: false, message: "Connection pending" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Get user connections
export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findById(userId).populate("connections followers following");

    const connections = user.connections
    const followers = user.followers
    const following = user.following

    const pendingConnections = (await Connection.find({
      to_user_id: userId,
      status: "pending",
    }).populate("from_user_id")).map(connection => connection.from_user_id);

    return res.json({ success: true, message: "Connections found", data: { connections, followers, following, pendingConnections } });

  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Accept connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.body;

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
    });

    if (!connection) {
      return res
        .status(400)
        .json({ success: false, message: "Connection request not found" });
    }

    const user = await User.findById(userId);
    user.connections.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.connections.push(userId);
    await toUser.save();

    connection.status = "accepted";
    await connection.save();

    res.json({ success: true, message: "Connection request accepted" });

  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};