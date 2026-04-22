import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, BellOff, Check, Loader2 } from "lucide-react";
import moment from "moment";
import api from "../api/axios";
import toast from "react-hot-toast";

const TABS = ["all", "likes", "comments"];

const Notifications = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setNotifications(data.notifications);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const markRead = useCallback(
    async (id) => {
      // Optimistic update — flip instantly, revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      try {
        const token = await getToken();
        await api.patch(
          `/api/notifications/${id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: false } : n)),
        );
      }
    },
    [getToken],
  );

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      const token = await getToken();
      await api.patch(
        "/api/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All caught up!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setMarkingAll(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filtered = notifications.filter((n) => {
    if (filter === "likes") return n.type === "like";
    if (filter === "comments") return n.type === "comment";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const likeCount = notifications.filter((n) => n.type === "like").length;
  const commentCount = notifications.filter((n) => n.type === "comment").length;

  return (
    <div className="h-full overflow-y-scroll bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Notifications
            </h1>
            <p className="text-sm mt-0.5">
              {unreadCount > 0 ? (
                <span className="text-indigo-600 font-medium">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="text-gray-400">You're all caught up</span>
              )}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {markingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {/* Stats row — only show when there are notifications */}
        {notifications.length > 0 && !loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard
              label="Total"
              value={notifications.length}
              colorClass="text-indigo-700 bg-indigo-50"
            />
            <StatCard
              label="Likes"
              value={likeCount}
              colorClass="text-red-600 bg-red-50"
              icon={<Heart className="w-3.5 h-3.5" />}
            />
            <StatCard
              label="Comments"
              value={commentCount}
              colorClass="text-indigo-600 bg-indigo-50"
              icon={<MessageCircle className="w-3.5 h-3.5" />}
            />
          </div>
        )}

        {/* Filter tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex mb-6 max-w-xs">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                filter === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <NotificationsSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((notification, i) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                index={i}
                onRead={markRead}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, colorClass, icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div
      className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${colorClass}`}
    >
      {icon}
      {label}
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

// ── Single notification item ──────────────────────────────────────────────────
const NotificationItem = ({ notification, index, onRead, navigate }) => {
  const isLike = notification.type === "like";
  const isUnread = !notification.read;

  const handleClick = () => {
    if (isUnread) onRead(notification._id);
    if (notification.post?._id) navigate(`/post/${notification.post._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative bg-white rounded-xl border transition-all duration-200 cursor-pointer
        hover:shadow-md hover:-translate-y-0.5
        ${
          isUnread ? "border-indigo-200 shadow-sm" : "border-gray-100 shadow-sm"
        }
      `}
    >
      {/* Left accent bar for unread */}
      {isUnread && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-indigo-500 rounded-full" />
      )}

      <div className="flex items-start gap-3 p-4 pl-5">
        {/* Avatar with type badge */}
        <div className="relative flex-shrink-0">
          <img
            src={notification.sender?.profile_picture}
            alt={notification.sender?.full_name}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white ${
              isLike ? "bg-red-50" : "bg-indigo-50"
            }`}
          >
            {isLike ? (
              <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500" />
            ) : (
              <MessageCircle className="w-2.5 h-2.5 text-indigo-600" />
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Name + action line */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">
              {notification.sender?.full_name}
            </span>
            <span className="text-gray-500 text-sm">
              {isLike ? "liked your post" : "commented on your post"}
            </span>
          </div>

          {/* Post text snippet */}
          {notification.post?.content && (
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">
              {notification.post.content}
            </p>
          )}

          {/* Comment preview */}
          {!isLike && notification.comment && (
            <div className="mt-2 inline-flex items-start gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 max-w-xs">
              <MessageCircle className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 italic line-clamp-2">
                "{notification.comment}"
              </p>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isUnread ? "bg-indigo-500" : "bg-gray-300"
              }`}
            />
            <span className="text-xs text-gray-400">
              {moment(notification.createdAt).fromNow()}
            </span>
          </div>
        </div>

        {/* Post thumbnail */}
        {notification.post?.image_urls?.[0] && (
          <div className="flex-shrink-0">
            <img
              src={notification.post.image_urls[0]}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border border-gray-100"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ── Skeleton loader ───────────────────────────────────────────────────────────
const NotificationsSkeleton = () => (
  <div className="flex flex-col gap-2">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 animate-pulse"
      >
        <div className="w-11 h-11 rounded-full bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-3.5 bg-gray-100 rounded-full w-2/3" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2" />
          <div className="h-3 bg-gray-100 rounded-full w-1/4" />
        </div>
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
      </div>
    ))}
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ filter }) => {
  const messages = {
    all: {
      title: "No notifications yet",
      sub: "When someone likes or comments on your posts, you'll see it here.",
    },
    likes: {
      title: "No likes yet",
      sub: "Your posts haven't been liked yet. Keep sharing!",
    },
    comments: {
      title: "No comments yet",
      sub: "No one has commented on your posts yet.",
    },
  };
  const { title, sub } = messages[filter];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <BellOff className="w-7 h-7 text-indigo-300" />
      </div>
      <div>
        <p className="text-gray-800 font-semibold">{title}</p>
        <p className="text-gray-400 text-sm mt-1 max-w-xs">{sub}</p>
      </div>
    </div>
  );
};

export default Notifications;
