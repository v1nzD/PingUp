import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middleware/auth.js";
import {
  addPost,
  getFeedPosts,
  likePost,
  addComment,
  deleteComment,
  getPostComments,
} from "../controllers/postController.js";

const postRouter = express.Router();

// Define post routes here (e.g., create post, get posts, etc.)

// add post route
postRouter.post("/add", upload.array("images", 4), protect, addPost);

// get posts route
postRouter.get("/feed", protect, getFeedPosts);

// like post route
postRouter.post("/like", protect, likePost);

postRouter.post("/comment/add", protect, addComment);
postRouter.post("/comment/delete", protect, deleteComment);
postRouter.get("/comment/:postId", protect, getPostComments);

export default postRouter;
