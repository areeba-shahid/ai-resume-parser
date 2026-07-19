// frontend/src/components/RealTimeUpdates.jsx
import React, { useState, useEffect } from "react";
import { connectSocket } from "../services/api";

function RealTimeUpdates() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = connectSocket();

    if (socket) {
      socket.on("new-application", (data) => {
        const id = Date.now();
        setNotifications((prev) =>
          [
            {
              id: id,
              message: `📝 New application received!`,
              type: "success",
              timestamp: new Date(),
            },
            ...prev,
          ].slice(0, 5)
        );

        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
      });

      socket.on("analysis-complete", (data) => {
        const id = Date.now();
        setNotifications((prev) =>
          [
            {
              id: id,
              message: `✅ Analysis complete! Score: ${data.score}%`,
              type: "info",
              timestamp: new Date(),
            },
            ...prev,
          ].slice(0, 5)
        );

        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
      });

      socket.on("status-update", (data) => {
        const id = Date.now();
        setNotifications((prev) =>
          [
            {
              id: id,
              message: `📊 Application status: ${data.status}`,
              type: "warning",
              timestamp: new Date(),
            },
            ...prev,
          ].slice(0, 5)
        );

        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
      });
    }

    return () => {
      if (socket) {
        socket.off("new-application");
        socket.off("analysis-complete");
        socket.off("status-update");
      }
    };
  }, []);

  const getTypeColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 border-green-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`${getTypeColor(
            notif.type
          )} border rounded-lg p-3 shadow-lg animate-slide-in`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm">
                {getIcon(notif.type)} {notif.message}
              </p>
              <p className="text-xs mt-1 opacity-75">
                {notif.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() =>
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== notif.id)
                )
              }
              className="ml-3 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RealTimeUpdates;
