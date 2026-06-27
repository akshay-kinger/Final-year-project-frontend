import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

const Chat = ({ onClose, productId, postedBy }) => {
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const { userId } = jwtDecode(token);
      setUserId(userId);

      // join room
      socket.emit("joinRoom", { roomId: productId });
    }
  }, [productId]);

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      if (!token || !userId) return;

      const res = await axios.get(
        `http://localhost:4000/api/chat/${productId}/${userId}/${postedBy._id}`,
        { headers: { authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        setMessages(res.data.messages);
      }
    };
    fetchMessages();
  }, [userId, productId, postedBy._id]);

  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("message");
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const token = localStorage.getItem("token");

    // Save to DB
    await axios.post(
      `http://localhost:4000/api/chat/`,
      { receiver: postedBy._id, text: input, roomId: productId },
      { headers: { authorization: `Bearer ${token}` } },
    );

    // Emit via socket only
    socket.emit("sendMessage", {
      receiver: postedBy._id,
      text: input,
      roomId: productId,
      token,
    });

    setInput("");
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const amPm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${amPm}`;
  };

  return (
    <div className="fixed bottom-4 right-4 w-[400px] h-[450px] bg-white rounded-lg shadow-lg flex flex-col z-50">
      <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-300 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-800">Chat</h3>
        <button
          onClick={onClose}
          className="text-white bg-red-500 hover:bg-red-600 rounded px-2 py-1 font-bold"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-2" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex flex-col ${msg.sender._id === userId ? "items-end" : "items-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-[60%] break-words ${msg.sender._id === userId ? "bg-green-200" : "bg-gray-300"}`}
            >
              {msg.text}
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {formatTime(msg.createdAt)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex p-4 border-t border-gray-300 rounded-b-lg">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary-dark"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
