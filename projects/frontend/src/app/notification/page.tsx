"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Navbar } from "@/components/navbar/Navbar";
import {
  NotificationCard,
  Notification,
} from "@/components/notification/notificationCard";

import { useNotifications } from "@/components/notification/NotificationContext";

export default function NotificationPage() {
  const router = useRouter();

  // 3. Get the new 'hasMore' state from your hook
  const { notifications, loadMore, markRead, reloadNotifications, hasMore } =
    useNotifications();

  useEffect(() => {
    reloadNotifications();
  }, []); // The empty array [] is very important

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      markRead(notification.id);
    }
    console.log("Notification clicked:", notification);
  };

  return (
    <div className="relative w-full max-w-[393px] mx-auto min-h-screen bg-[#FFF8F0] flex flex-col">
      <main className="flex-1 py-1 font-alt pb-24">
        <div className="mx-auto w-full">
          {/* Back Button + Title */}
          <div className="mt-1 mb-6 flex items-center gap-4 px-4">
            <button
              aria-label="Back"
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#EB6223] flex items-center justify-center shadow hover:scale-105 transition flex-shrink-0"
            >
              <FiArrowLeft className="text-[#000000]" size={17} />
            </button>
            <h1 className="text-2xl font-semibold text-[#1f1f1f]">
              Notifications
            </h1>
          </div>

          {/* 6. Check the REAL notifications array */}
          {notifications.length > 0 ? (
            <>
              <section className="relative z-0 bg-white shadow-md mb-6 overflow-hidden">
                {/* 7. Map over the REAL notifications */}
                <div>
                  {notifications.map((notification, index) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      showBorder={index < notifications.length - 1}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </section>

              {/* Load More Button - UPDATED SECTION */}
              <div className="flex justify-center px-8 pb-6">
                <button
                  onClick={loadMore}
                  // 9. Disable the button when hasMore is false
                  disabled={!hasMore}
                  className="h-11 w-full rounded-full bg-[#C5E99B] border-2 border-black text-base font-semibold hover:bg-[#b5d98b] transition-colors 
                             disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed" // 10. Added disabled styles
                >
                  {/* 11. Conditionally change the text */}
                  {hasMore ? "Load more" : "🎉 You are up to date"}
                </button>
              </div>
            </>
          ) : (
            /* Empty State */
            <section className="relative z-0 mx-4 bg-white rounded-[60px] shadow py-16">
              <div className="flex flex-col items-center justify-center px-8">
                <div className="text-center">
                  <div className="mb-4">
                    <svg
                      className="mx-auto w-20 h-20 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-1">
                    No notifications yet
                  </p>
                  <p className="text-sm text-gray-500">
                    You will be notified when there are updates
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Navbar */}
      <footer className="mt-auto sticky bottom-0 w-full px-1 pb-[env(safe-area-inset-bottom)] z-50">
        <Navbar />
      </footer>
    </div>
  );
}