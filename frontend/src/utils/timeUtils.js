// src/utils/timeUtils.js
// Centralised, timezone-safe time helpers.
//
// MySQL TIMESTAMP columns are stored in UTC.
// The driver returns them as JS Date objects OR as strings like
// "2024-05-16 14:30:00" (no timezone suffix).
// We always append "Z" so the JS Date constructor treats them as UTC,
// then browser's local timezone is applied automatically when formatting.

/**
 * Returns a human-readable relative time string.
 *   "Just now"  /  "42 seconds ago"  /  "3 minutes ago"  / …
 *
 * @param {string|Date|null} rawDate — value from created_at / acknowledged_at
 * @returns {string}
 */
export function formatRelativeTime(rawDate) {
  if (!rawDate) return "Unknown";

  // Normalise: replace space separator with T, add Z if no tz info present
  const str   = String(rawDate).replace(" ", "T");
  const fixed = str.endsWith("Z") || str.includes("+") ? str : str + "Z";
  const date  = new Date(fixed);

  if (isNaN(date.getTime())) return "Unknown";

  const diffMs  = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs  / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr  / 24);

  if (diffSec < 10)  return "Just now";
  if (diffSec < 60)  return `${diffSec} seconds ago`;
  if (diffMin < 2)   return "1 minute ago";
  if (diffMin < 60)  return `${diffMin} minutes ago`;
  if (diffHr  < 2)   return "1 hour ago";
  if (diffHr  < 24)  return `${diffHr} hours ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7)   return `${diffDay} days ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Returns a full localised date+time string suitable for a tooltip.
 * e.g. "May 16, 2:30 PM"
 */
export function formatAbsoluteTime(rawDate) {
  if (!rawDate) return "";

  const str   = String(rawDate).replace(" ", "T");
  const fixed = str.endsWith("Z") || str.includes("+") ? str : str + "Z";
  const date  = new Date(fixed);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}