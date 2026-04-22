import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ── Async thunk — fetch unread count only (lightweight, used by sidebar) ─────
export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (token, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        return data.notifications.filter((n) => !n.read).length;
      }
      return rejectWithValue(data.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    unreadCount: 0,
  },
  reducers: {
    // Call this after marking all read on the Notifications page
    clearUnreadCount(state) {
      state.unreadCount = 0;
    },
    // Call this after marking a single notification read
    decrementUnreadCount(state) {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });
  },
});

export const { clearUnreadCount, decrementUnreadCount } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;
