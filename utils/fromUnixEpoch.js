export const fromUnixEpoch = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const hour = date.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${month} ${day}, ${hour12}:${String(date.getMinutes()).padStart(
    2,
    "0"
  )}${ampm}`;
};
