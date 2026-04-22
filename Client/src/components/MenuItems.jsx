import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  MessageCircle,
  Users,
  Search,
  User as UserIcon,
  Bell,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { fetchUnreadCount } from "../features/notifications/notificationsSlice";

const menuItemsData = [
  { to: "/", label: "Feed", Icon: Home },
  { to: "/messages", label: "Messages", Icon: MessageCircle },
  { to: "/connections", label: "Connections", Icon: Users },
  { to: "/discover", label: "Discover", Icon: Search },
  { to: "/notifications", label: "Notifications", Icon: Bell },
  { to: "/profile", label: "Profile", Icon: UserIcon },
];

const MenuItems = ({ setSidebarOpen }) => {
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  // Fetch unread count once on mount so the badge is ready immediately
  useEffect(() => {
    getToken().then((token) => dispatch(fetchUnreadCount(token)));
  }, []);

  return (
    <div className="px-6 text-gray-600 space-y-2 font-medium">
      {menuItemsData.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `px-3.5 py-2 flex items-center gap-3 rounded-xl ${
              isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
            }`
          }
        >
          {/* Bell icon gets a red unread badge, all others render normally */}
          {label === "Notifications" ? (
            <div className="relative">
              <Icon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          ) : (
            <Icon className="w-5 h-5" />
          )}
          {label}
        </NavLink>
      ))}
    </div>
  );
};

export default MenuItems;
