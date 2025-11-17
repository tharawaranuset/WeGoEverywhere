"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export interface Notification {
  id: number;
  userId: number;
  title: string;
  fromService: string | null;
  message: string;
  read: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface NotificationCardProps {
  notification: Notification;
  showBorder?: boolean;
  onClick?: (notification: Notification) => void;
}

export function NotificationCard({
  notification,
  showBorder = true,
  onClick,
}: NotificationCardProps) {
  const isRead = notification.read ?? false;
  const timeAgo = dayjs(notification.createdAt).fromNow();

  return (
    <div
      onClick={() => onClick?.(notification)}
      className={`flex items-start justify-between px-5 py-4 
        transition-all duration-200 cursor-pointer shadow-sm
        ${showBorder ? "border-b border-gray-100" : ""}
        ${!isRead ? "bg-white hover:bg-[#F8FAFC]" : "bg-gray-50 hover:bg-gray-100"}
        ${isRead ? "opacity-75" : "opacity-100"}
      `}
    >
      {/* Left side: text */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-1">
          {notification.title}
        </h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-snug">
          {notification.message}
        </p>
        <span className="text-gray-400 text-xs mt-1 block">{timeAgo}</span>
      </div>

      {/* Right side: blue dot if unread */}
      {!isRead && (
        <div className="ml-3 mt-1">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
}
