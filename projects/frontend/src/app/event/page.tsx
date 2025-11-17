"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/navbar/Navbar";
import { eventApi, convertEventToUIFormat, type Event } from "@/lib/api/eventApi";
import { UserService } from "@/lib/api";
import toast from "react-hot-toast";
import { Calendar, MapPin, Users } from "lucide-react";

export default function EventPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"created" | "attending" | "history">("created");
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userData = await UserService.userControllerGetUser();
      setUser(userData);

      // Fetch all events
      const eventsData = await eventApi.getAllEvents();
      const uiFormattedEvents = eventsData.map(convertEventToUIFormat);
      setAllEvents(uiFormattedEvents);

      // Fetch user's joined events
      const joinedEventsData = await eventApi.getUserJoinedEvents();
      const uiFormattedJoinedEvents = joinedEventsData.map(convertEventToUIFormat);
      setJoinedEvents(uiFormattedJoinedEvents);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Cannot load data");
    } finally {
      setLoading(false);
    }
  };

const filterEvents = () => {
  const now = new Date();

  let events: Event[] = [];

  if (activeTab === "created") {
    events = allEvents.filter((event) => event.userId === user.userId);
  } else if (activeTab === "attending") {
    events = joinedEvents.filter((event) => event.userId !== user.userId);
  } else if (activeTab === "history") {
    const createdEvents = allEvents.filter((event) => event.userId === user.userId);
    const allHistoryEvents = [...createdEvents, ...joinedEvents];
    events = Array.from(new Map(allHistoryEvents.map(e => [e.eventId, e])).values());
  }

  return events
    .filter((event) => event.status !== 'deleted')
    .filter((event) => {
      if (activeTab === "created") {
        return true;
      }
      return event.status !== 'inactive';
    })
    .filter((event) => {
      const [hours, minutes] = event.time.split(':').map(Number);
      const eventDateTime = new Date(event.date);
      eventDateTime.setHours(hours, minutes, 0, 0);
      
      if (activeTab === "history") {
        return eventDateTime < now;
      } else {
        return eventDateTime >= now;
      }
    })
    .sort((a, b) => {
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) {
        // History: newest first (reverse order), others: oldest first
        return activeTab === "history" ? -dateComparison : dateComparison;
      }
      const timeComparison = a.time.localeCompare(b.time);
      return activeTab === "history" ? -timeComparison : timeComparison;
    });
};


  const handleEventClick = (eventId: number | string) => {
    if (activeTab === "created") {
      router.push(`/event/${eventId}/edit`);
    } else {
      router.push(`/event/${eventId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-[#C5E99B]',
          text: 'Active'
        };
      case 'inactive':
        return {
          bg: 'bg-[#FFB3B3]',
          text: 'Inactive'
        };
      default:
        return {
          bg: 'bg-gray-300',
          text: status
        };
    }
  };

  const filteredEvents = filterEvents();

  return (
    <div className="relative w-full max-w-[393px] mx-auto min-h-screen bg-[#FFF8F0] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-6 pt-4 pb-24 font-alt">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("created")}
            className={`flex-1 h-12 rounded-full text-base font-semibold transition-colors ${
              activeTab === "created"
                ? "bg-[#FFD5C7] text-black"
                : "bg-white text-gray-600"
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setActiveTab("attending")}
            className={`flex-1 h-12 rounded-full text-base font-semibold transition-colors ${
              activeTab === "attending"
                ? "bg-[#FFD5C7] text-black"
                : "bg-white text-gray-600"
            }`}
          >
            Attending
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 h-12 rounded-full text-base font-semibold transition-colors ${
              activeTab === "history"
                ? "bg-[#FFD5C7] text-black"
                : "bg-white text-gray-600"
            }`}
          >
            History
          </button>
        </div>

        {/* Event Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">
                No events yet
              </p>
              <p className="text-sm text-gray-500">
                {activeTab === "created"
                  ? "Create your first event!"
                  : activeTab === "attending"
                  ? "Join an event to see it here"
                  : "No past events"}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[350px] mx-auto grid grid-cols-2 gap-4">
            {filteredEvents.map((event) => {
              const statusBadge = getStatusBadge(event.status);
              
              return (
                <div
                  key={event.eventId}
                  className="bg-[#FFF3D2] rounded-[18px] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleEventClick(event.eventId)}
                >
                  {/* Image container - gradient removed since coverUrl is required */}
                  <div className="relative h-[80px] w-full bg-gray-200">
                    <img
                      src={event.coverUrl}
                      alt={event.title || event.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    
                    {/* Status Badge for Created tab */}
                    {activeTab === "created" && (
                      <div className="absolute top-2 left-2 z-20">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} text-black`}
                        >
                          {statusBadge.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="bg-[#D4DDFF] rounded-t-[18px] p-3">
                    <div className="space-y-1">
                      {/* Date and Time */}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-600" />
                        <span className="font-inter font-normal text-[8px] text-black">
                          {formatDate(event.date)} • {formatTime(event.time)}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h3 className="font-inter font-medium text-[10px] leading-[12px] text-black line-clamp-2 min-h-[24px] max-h-[24px] overflow-hidden flex items-start">
                        {event.title || event.name}
                      </h3>

                      {/* Location */}
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-600" />
                        <span className="font-inter font-normal text-[8px] text-gray-700 truncate">
                          {event.location || event.place || 'TBD'}
                        </span>
                      </div>

                      {/* Participants */}
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-600" />
                        <span className="font-inter font-normal text-[8px] text-gray-700">
                          {event.currentParticipants}/{event.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Navbar */}
      <footer className="sticky bottom-0 w-full px-1 pb-[env(safe-area-inset-bottom)] z-50">
        <Navbar />
      </footer>
    </div>
  );
}