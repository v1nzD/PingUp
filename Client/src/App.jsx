import React, { useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Feed from "./pages/Feed.jsx";
import Messages from "./pages/Messages.jsx";
import ChatBox from "./pages/ChatBox.jsx";
import Connections from "./pages/Connections.jsx";
import Discover from "./pages/Discover.jsx";
import Profile from "./pages/Profile.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import { useUser, useAuth } from "@clerk/clerk-react";
import Layout from "./pages/Layout.jsx";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchUser } from "./features/user/userSlice.js";
import { fetchConnections } from "./features/connections/connectionsSlice.js";
import { addMessage } from "./features/messages/messagesSlice.js";
import toast from "react-hot-toast";
import Notification from "./components/Notification.jsx";


const App = () => {
  const { user, isLoaded } = useUser();
  const { userId, getToken } = useAuth();
  const location = useLocation();
  const pathnameRef = useRef(location);

  const dispatch = useDispatch();

  // ------------------------------------------
  // Fetch logged-in user data + connections
  // ------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      const token = await getToken();
      dispatch(fetchUser(token));
      dispatch(fetchConnections(token));
    };

    fetchData();
  }, [userId, getToken, dispatch]);

  // ------------------------------------------
  // Keep current pathname updated
  // ------------------------------------------
  useEffect(() => {
    pathnameRef.current = location;
  }, [location]);

  // ------------------------------------------
  // SSE - Real-time message listener
  // ------------------------------------------
  useEffect(() => {
    if (!userId) return;

    const eventSource = new EventSource(
      `${import.meta.env.VITE_BASEURL}/api/message/${userId}`
    );

    console.log("SSE Connected:", userId);

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Get current chat user ID from URL
      const currentChatUserId =
        pathnameRef.current.pathname.split("/").pop();

      // Handle both populated and non-populated structures safely
      const senderId =
        typeof message.from_user_id === "string"
          ? message.from_user_id
          : message.from_user_id._id;

      if (currentChatUserId === senderId) {
        // If user is already inside chat -> just add message
        dispatch(addMessage(message));
      } else {
        // Show toast notification
        toast.custom((t)=>(
          <Notification t={t} message={message} />
        ), {position: "bottom-right"})
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
    };

    return () => {
      console.log("SSE Disconnected:", userId);
      eventSource.close();
    };
  }, [userId, dispatch]);

  // ------------------------------------------
  // Prevent render until Clerk is ready
  // ------------------------------------------
  if (!isLoaded) return null;

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;