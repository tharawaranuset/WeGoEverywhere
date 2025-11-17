'use client';

import { useNotifications } from '@/components/notification/NotificationContext';
import { NotificationCard, Notification } from './notificationCard'; // Make sure Notification is imported

export default function NotificationList() {
  // Get all the functions from the context
  const { notifications, notifCount, markRead, loadMore } = useNotifications();

  // --- 1. ADD THIS CLICK HANDLER ---
  // (This is the logic that was missing)
  const handleCardClick = (notification: Notification) => {
    // Only mark as read if it's not already read
    if (!notification.read) {
      markRead(notification.id);
    }
    
    // TODO: You could add navigation logic here
    // e.g., router.push(`/events/${notification.eventId}`);
    console.log("Clicked notification in popover");
  };

  return (
    <div className="w-80 text-black"> 
      <h3 className="mb-2 font-bold px-4 pt-4 text-gray-900">
        Unread notifications: {notifCount}
      </h3>

      <div className="max-h-96 overflow-y-auto"> 
        {notifications.length === 0 && (
          <p className="text-gray-500 px-4 py-3">No new notifications.</p>
        )}

        {notifications.map((n) => (
          <NotificationCard
            key={n.id}
            notification={n}
            // --- 2. PASS THE HANDLER TO THE CARD ---
            onClick={handleCardClick} 
            showBorder={true}
          />
        ))}
      </div>

      <div className="p-2 border-t border-gray-200">
        <button
          onClick={loadMore}
          className="w-full px-3 py-1 bg-green-500 text-white rounded"
        >
          Load more
        </button>
      </div>
    </div>
  );
}