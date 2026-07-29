const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Updated recently";

  const deltaSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(deltaSec);

  if (abs < 45) return "Updated just now";
  if (abs < 3600) {
    return `Updated ${rtf.format(Math.round(deltaSec / 60), "minute")}`;
  }
  if (abs < 86400) {
    return `Updated ${rtf.format(Math.round(deltaSec / 3600), "hour")}`;
  }
  if (abs < 86400 * 30) {
    return `Updated ${rtf.format(Math.round(deltaSec / 86400), "day")}`;
  }
  return `Updated ${new Date(iso).toLocaleDateString()}`;
}
