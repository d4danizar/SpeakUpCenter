"use client";

import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  message: string;
};

export function AnnouncementBanner({ announcements }: { announcements: Announcement[] }) {
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Check localStorage for each announcement
    try {
      const active = announcements.filter(a => {
        return localStorage.getItem(`dismissed_announcement_${a.id}`) !== "true";
      });
      setVisibleAnnouncements(active);
    } catch (e) {
      setVisibleAnnouncements(announcements);
    }
  }, [announcements]);

  const handleDismiss = (id: string) => {
    try {
      localStorage.setItem(`dismissed_announcement_${id}`, "true");
    } catch (e) {
      console.error("Error setting localStorage for banner dismiss", e);
    }
    
    setVisibleAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="w-full">
      {visibleAnnouncements.map(ann => (
        <div key={ann.id} className="relative w-full bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-4 flex justify-between items-start shadow-sm animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 pt-0.5 text-left pr-6">
              <h3 className="font-bold text-orange-900 text-sm sm:text-base">{ann.title}</h3>
              <p className="mt-1 text-xs sm:text-sm text-orange-800 leading-relaxed font-medium">
                {ann.message}
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleDismiss(ann.id)}
            className="p-1.5 shrink-0 rounded-lg text-orange-400 hover:text-orange-600 hover:bg-orange-100/50 transition-colors"
            title="Tutup Pengumuman"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
