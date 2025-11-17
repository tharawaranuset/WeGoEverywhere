"use client";
// Extend the Window type to allow fetchUserJoinedEvents
declare global {
  interface Window {
    fetchUserJoinedEvents?: () => void;
  }
}

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { Search, Mic, MapPin, Users, Calendar } from "lucide-react";
import Image from "next/image";
import { OpenAPI } from "@/lib/api";
import { userApi, type User } from "@/lib/api/userApi";
import {
  eventApi,
  convertEventToUIFormat,
  type Event,
} from "@/lib/api/eventApi";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  const router = useRouter();

  // Navigate to event detail or edit page based on organizer
  const handleEventClick = (eventId: number | string) => {
    const clickedEvent = events.find(e => e.eventId === eventId);
    if (clickedEvent && user && clickedEvent.userId === user.userId) {
      router.push(`/event/${eventId}/edit`);
    } else {
      router.push(`/event/${eventId}`);
    }
  } 

  const fetchUser = async () => {
    try {
      setLoading(true);
      const userData = await userApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const eventsData = await eventApi.getAllEvents();
      const uiFormattedEvents = eventsData.map(convertEventToUIFormat);
      setEvents(uiFormattedEvents);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEvents([]);
    }
  };

  const fetchUserJoinedEvents = async () => {
    try {
      const joinedEventsData = await eventApi.getUserJoinedEvents();
      const now = new Date();
      const uiFormattedJoinedEvents = joinedEventsData
        .map(convertEventToUIFormat)
        .filter(
          (event) => event.status !== "deleted" && event.status !== "inactive"
        )
        .filter((event) => {
          const [hours, minutes] = event.time.split(":").map(Number);
          const eventDateTime = new Date(event.date);
          eventDateTime.setHours(hours, minutes, 0, 0);
          return eventDateTime >= now;
        })
        .sort((a, b) => {
          const dateComparison =
            new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateComparison !== 0) return dateComparison;
          return a.time.localeCompare(b.time);
        });
      setUpcomingEvents(uiFormattedJoinedEvents);
    } catch (error) {
      console.error("Failed to fetch user joined events:", error);
      setUpcomingEvents([]);
    }
  };

  const filterTags: string[] = [
    "Entertainment",
    "Education",
    "Health",
    "Lifestyle",
    "Technology",
    "Environment",
  ];

  // Helper to get the first category as string
  const getPrimaryCategory = (categories?: string[] | string) => {
    if (Array.isArray(categories)) return categories[0] || "General";
    if (typeof categories === "string") return categories;
    return "General";
  };

  // Filter out deleted, inactive, and past events (same strategy as upcomingEvents)
  const filteredEvents = events
    .map(convertEventToUIFormat)
    .filter(
      (event) => event.status !== "deleted" && event.status !== "inactive"
    )
    .filter((event) => {
      const now = new Date();

      const [hours, minutes] = event.time.split(":").map(Number);
      const eventDateTime = new Date(event.date);
      eventDateTime.setHours(hours, minutes, 0, 0);

      return eventDateTime >= now;
    })
    .filter((event) => {
      const matchesSearch =
        (event.title || event.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.description || event.detail || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const eventCategories = (
        Array.isArray(event.categories) ? event.categories : [event.categories]
      ).filter((cat): cat is string => typeof cat === "string");
      const matchesFilter =
        selectedFilters.length === 0 ||
        selectedFilters.every((sel) => eventCategories.includes(sel));
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateComparison =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      return a.time.localeCompare(b.time);
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCategoriesColor = (categories: string[] | string) => {
    const colors: Record<string, string> = {
      Entertainment: "from-pink-300 to-pink-500",
      Education: "from-blue-300 to-blue-500",
      Health: "from-green-300 to-green-500",
      Lifestyle: "from-orange-300 to-orange-500",
      Technology: "from-cyan-300 to-cyan-500",
      Environment: "from-emerald-300 to-emerald-500",
      General: "from-gray-300 to-gray-500",
    };
    const cat = getPrimaryCategory(categories);
    return colors[cat] || "from-gray-300 to-gray-500";
  };

  useEffect(() => {
    fetchUser();
    fetchEvents();
    fetchUserJoinedEvents();
    // Expose fetchUserJoinedEvents globally so event detail page can trigger refresh
    if (typeof window !== "undefined") {
      window.fetchUserJoinedEvents = fetchUserJoinedEvents;
    }
    const defaultHeader = document.getElementById("default-header");
    if (defaultHeader) {
      defaultHeader.style.display = "none";
    }
    return () => {
      const defaultHeader = document.getElementById("default-header");
      if (defaultHeader) {
        defaultHeader.style.display = "block";
      }
      if (typeof window !== "undefined" && window.fetchUserJoinedEvents) {
        delete window.fetchUserJoinedEvents;
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-[393px] mx-auto min-h-screen bg-white flex flex-col">
      {/* Custom Header Banner for Home Page - Sticky */}
      <div className="sticky top-0 z-50 bg-brand-primary">
        <header className="bg-[var(--color-brand-secondary)] rounded-b-[50px] px-3 py-5 overflow-hidden">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <h1 className="text-xl font-alt sm:text-2xl font-extrabold leading-none -translate-y-0.5 sm:-translate-y-1 ml-2 sm:ml-4">
              <span className="block text-[var(--color-brand-tertiary)]">
                WeGo
              </span>
              <span className="block text-[var(--color-brand-tertiary)]">
                EveryWhere
              </span>
            </h1>
            {/* Profile Picture */}
            <div className="relative h-[70px] w-[70px] rounded-full ring-3 ring-white shadow-lg overflow-hidden bg-white shrink-0">
              {loading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse rounded-full" />
              ) : (
                <Image
                  src={
                    user?.profilePicture
                      ? user.profilePicture.startsWith("http")
                        ? user.profilePicture
                        : `${OpenAPI.BASE}${user.profilePicture}`
                      : "/images/profile_image.png"
                  }
                  alt="User Profile"
                  fill
                  sizes="70px"
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/images/profile_image.png";
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex justify-center mt-3">
            <div className="font-inter font-bold text-[15px] leading-[20px] text-black">
              Good Morning, "
              {loading ? "first name" : user?.firstName || "first name"}"
            </div>
          </div>
        </header>
      </div>

      {/* Main Content - Centered and Responsive */}
      <div className="flex-1 flex flex-col items-center px-4 pt-4 pb-20">
        {/* Up Coming Event Section */}
        <div className="w-full max-w-[350px] bg-[#FFFBF0] border border-black rounded-[18px] p-4 mb-6">
          <h2 className="font-inter font-bold text-[17px] leading-[22px] text-black mb-4">
            Up Coming Event
          </h2>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
              {upcomingEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="flex-shrink-0 w-[110px] cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleEventClick(event.eventId)}
                >
                  <div
                    className={`relative w-full h-[90px] rounded-[18px] mb-2 overflow-hidden bg-gradient-to-br ${getCategoriesColor(
                      event.categories ?? "General"
                    )}`}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-5"></div>
                    <img
                      src={event.coverUrl}
                      alt={event.title || event.name}
                      className="absolute inset-0 w-full h-full object-cover z-10"
                      onError={(e) => {
                        console.log("Image failed to load:", event.coverUrl);
                        e.currentTarget.style.display = "none";
                      }}
                      onLoad={() => {
                        console.log(
                          "Image loaded successfully:",
                          event.coverUrl
                        );
                      }}
                    />
                  </div>
                  <div className="w-full bg-white rounded-[18px] p-2">
                    <div className="space-y-1">
                      <div className="font-inter font-medium text-[10px] leading-[12px] text-black">
                        {formatDate(event.date)}
                      </div>
                      <div className="font-inter font-normal text-[9px] leading-[11px] text-black line-clamp-2">
                        {event.title || event.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-2.5 h-2.5 text-gray-600" />
                        <span className="font-inter font-normal text-[8px] text-gray-700">
                          {event.currentParticipants || 0}/{event.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="w-full max-w-[350px] mb-6">
          <div className="flex items-center w-full h-[44px] bg-gray-200/40 rounded-full px-3">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[17px] text-gray-600 placeholder-gray-400 focus:outline-none"
            />
            <Mic className="w-4 h-5 text-gray-400 ml-2" />
          </div>
        </div>

        {/* Filter Tags */}
        <div className="w-full max-w-[350px] mb-6">
          <div className="overflow-x-auto scrollbar-hide">
            <div
              className="flex space-x-2 pb-2"
              style={{ width: "max-content" }}
            >
              {filterTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedFilters(
                      selectedFilters.includes(tag)
                        ? selectedFilters.filter((t) => t !== tag)
                        : [...selectedFilters, tag]
                    );
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-[30px] transition-colors ${
                    selectedFilters.includes(tag)
                      ? "bg-[#EB6223] text-white"
                      : "bg-[#D4CDCD] text-black"
                  }`}
                >
                  <span className="font-inter font-normal text-[12px] leading-[22px] capitalize whitespace-nowrap">
                    {tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Event Grid */}
        <div className="w-full max-w-[350px] min-h-[200px]">
          {filteredEvents.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>

              <p className="text-sm font-semibold text-gray-700">
                No events found
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            /* GRID WHEN EVENTS EXIST */
            <div className="grid grid-cols-2 gap-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="bg-[#FFF3D2] rounded-[18px] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleEventClick(event.eventId)}
                >
                  <div
                    className={`relative h-[80px] w-full bg-gradient-to-br ${getCategoriesColor(
                      event.categories ?? "General"
                    )}`}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-5"></div>
                    <img
                      src={event.coverUrl}
                      alt={event.title || event.name}
                      className="absolute inset-0 w-full h-full object-cover z-10"
                      onError={(e) => {
                        console.log(
                          "Main grid image failed to load:",
                          event.coverUrl
                        );
                        e.currentTarget.style.display = "none";
                      }}
                      onLoad={() => {
                        console.log(
                          "Main grid image loaded successfully:",
                          event.coverUrl
                        );
                      }}
                    />
                  </div>

                  <div className="bg-[#D4DDFF] rounded-t-[18px] p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-600" />
                        <span className="font-inter font-normal text-[8px] text-black">
                          {formatDate(event.date)} • {formatTime(event.time)}
                        </span>
                      </div>

                      <h3 className="font-inter font-medium text-[10px] leading-[12px] text-black line-clamp-2 min-h-[24px] max-h-[24px] overflow-hidden flex items-start">
                        {event.title || event.name}
                      </h3>

                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-600" />
                        <span className="font-inter font-normal text-[8px] text-gray-700 truncate">
                          {event.location || event.place || "TBD"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-600" />
                        <span className="font-inter font-normal text-[8px] text-gray-700">
                          {event.currentParticipants}/{event.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom Navbar, consistent across all pages */}
      <footer className="sticky bottom-0 w-full z-50 bg-transparent max-w-[393px] mx-auto">
        <Navbar />
      </footer>
    </div>
  );
}
