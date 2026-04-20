import React, { useEffect, useRef, useState } from "react";
import { BadgeCheck, Heart, X } from "lucide-react";
import moment from "moment";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const CommentModal = ({
  post,
  onClose,
  likes,
  onLike,
  onCommentCountChange,
}) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const commentsEndRef = useRef(null);

  const postWithHashtags = post.content?.replace(
    /(#\w+)/g,
    '<span class="text-indigo-600">$1</span>',
  );

  useEffect(() => {
    fetchComments();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    onCommentCountChange(comments.length);
  }, [comments]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/post/comment/${post._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setComments(data.comments);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      setSubmitting(true);
      const { data } = await api.post(
        `/api/post/comment/add`,
        { postId: post._id, text },
        { headers: { Authorization: `Bearer ${await getToken()}` } },
      );
      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setText("");
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { data } = await api.post(
        `/api/post/comment/delete`,
        { commentId },
        { headers: { Authorization: `Bearer ${await getToken()}` } },
      );
      if (data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg flex flex-col max-h-[85vh] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <span className="font-medium text-gray-900">Post</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {/* Post author */}
          <div className="flex items-center gap-3">
            <img
              src={post.user.profile_picture}
              alt=""
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm">
                  {post.user.full_name}
                </span>
                <BadgeCheck className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500">
                @{post.user.username} · {moment(post.createdAt).fromNow()}
              </p>
            </div>
          </div>

          {/* Post content */}
          {post.content && (
            <div
              className="text-gray-800 text-sm whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: postWithHashtags }}
            />
          )}

          {/* Post images */}
          {post.image_urls?.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.image_urls.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className={`w-full h-48 object-cover rounded-lg ${
                    post.image_urls.length === 1 && "col-span-2 h-auto"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Like action */}
          <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1">
              <Heart
                className={`w-4 h-4 cursor-pointer transition ${
                  likes.includes(currentUser._id)
                    ? "text-red-500 fill-red-500"
                    : ""
                }`}
                onClick={onLike}
              />
              <span>{likes.length}</span>
            </div>
            <span className="text-gray-400 text-xs">
              {comments.length} comment{comments.length !== 1 && "s"}
            </span>
          </div>

          {/* Comments list */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Comments
            </p>

            {loading && (
              <p className="text-sm text-gray-400 text-center py-4">
                Loading comments…
              </p>
            )}

            {!loading && comments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No comments yet. Be the first!
              </p>
            )}

            {comments.map((comment) => (
              <div key={comment._id} className="flex gap-2">
                <img
                  src={comment.user.profile_picture}
                  alt=""
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {comment.user.full_name}
                    </span>
                    {comment.user._id === currentUser._id && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 mt-0.5">{comment.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {moment(comment.createdAt).fromNow()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Fixed comment input */}
        <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-200 flex-shrink-0 bg-white">
          <img
            src={currentUser.profile_picture}
            alt=""
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment…"
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 max-h-24 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-indigo-700 transition flex-shrink-0"
          >
            {submitting ? "…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
