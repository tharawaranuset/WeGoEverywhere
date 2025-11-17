'use client';

import { useState } from 'react';
import { useNotifications } from '../notification/NotificationContext'; // Adjust path
import NotificationList from './NotificationListener'; // Adjust path
import { FiBell } from 'react-icons/fi'; // Import your icon

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  // 1. Get the live count from the context
  const { notifCount } = useNotifications();

  return (
    <div className="relative">
      {/* 2. Your Bell Icon Button */}
      <button
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow"
      >
        <FiBell className="text-[#2E2E2E]" size={20} />

        {/* 3. The Unread Count Badge */}
        {notifCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {notifCount}
          </span>
        )}
      </button>

      {/* 4. The Popover (Your "Noti Part") */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50"
          onClick={(e) => e.stopPropagation()} 
        >
          <NotificationList />
        </div>
      )}
    </div>
  );
}