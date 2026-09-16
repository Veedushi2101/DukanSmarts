import { useEffect, useRef } from "react";

const INACTIVITY_LIMIT_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const LAST_ACTIVITY_KEY = "dukansmarts_last_active_timestamp";
const CHECK_INTERVAL_MS = 60 * 1000; // Check expiration every 60 seconds

export const useInactivityTimeout = (onTimeout: () => void, isEnabled: boolean) => {
  const lastWriteRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isEnabled) return;

    // Initialize or read last activity
    const recordActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 10 seconds to avoid performance drag
      if (now - lastWriteRef.current > 10000) {
        lastWriteRef.current = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      }
    };

    // If starting fresh with no timestamp, set it now
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    // Check if 3 hours have already elapsed
    const checkInactivity = () => {
      const storedTime = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (storedTime) {
        const lastActive = parseInt(storedTime, 10);
        if (Date.now() - lastActive >= INACTIVITY_LIMIT_MS) {
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          onTimeout();
        }
      }
    };

    // Run check immediately on mount/focus
    checkInactivity();

    // User interaction events to monitor
    const activityEvents: (keyof WindowEventMap)[] = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    // Run check periodically
    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    // Also check immediately when the user switches back to this tab
    window.addEventListener("focus", checkInactivity);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
      clearInterval(intervalId);
      window.removeEventListener("focus", checkInactivity);
    };
  }, [isEnabled, onTimeout]);
};