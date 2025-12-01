const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC" });

export function formatDate(dateInput: string | Date) {
  return dateFormatter.format(typeof dateInput === "string" ? new Date(dateInput) : dateInput);
}
