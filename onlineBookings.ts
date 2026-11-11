/**
 * Online bookings: the times a patient can reserve and what they can ask for.
 *
 * The web server decides all of it, as it's the one that can check a booking
 * code and reach the database. It's only reachable over the tailnet, and it
 * returns only times, so this app never receives patient details.
 */

export type BookingSlot = {
  operator: string;
  startTime: Temporal.PlainDateTime;
  endTime: Temporal.PlainDateTime;
};

/** A slot as the web server sends it. */
type SentSlot = { operator: string; startTime: string; endTime: string };

const toSlot = ({ operator, startTime, endTime }: SentSlot): BookingSlot => ({
  operator,
  startTime: Temporal.PlainDateTime.from(startTime),
  endTime: Temporal.PlainDateTime.from(endTime),
});

/** What a booking route answers, or null if it doesn't accept the code. */
async function postBooking<T>(path: string, body: unknown): Promise<T | null> {
  const response = await fetch(
    `${Deno.env.get("WEBSERVER_URL")}/appointment/${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (response.status === 403) {
    await response.body?.cancel();
    return null;
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Error posting to ${path}: ${response.status}`);
  }
  return await response.json() as T;
}

export type BookingOptions = {
  /** The time the patient already has reserved, if any. */
  reservation: BookingSlot | null;
  slots: BookingSlot[];
  operators: string[];
};

/** What the code's holder can choose from, or null for a code that isn't valid. */
export async function getBookingOptions(
  code: string,
): Promise<BookingOptions | null> {
  const options = await postBooking<{
    reservation: SentSlot | null;
    slots: SentSlot[];
    operators: string[];
  }>("booking-options", { code });
  return options && {
    reservation: options.reservation && toSlot(options.reservation),
    slots: options.slots.map(toSlot),
    operators: options.operators,
  };
}

export type ReserveResult =
  /** Saved for the patient. */
  | { kind: "reserved"; slot: BookingSlot }
  /** The patient already holds a reservation. */
  | { kind: "already"; reservation: BookingSlot }
  /** Reserved by someone else, booked or past since the page loaded. */
  | { kind: "taken" }
  /** The booking code is no longer valid. */
  | { kind: "invalid" };

export async function reserveSlot(
  code: string,
  slot: string,
): Promise<ReserveResult> {
  const result = await postBooking<
    | { kind: "reserved"; slot: SentSlot }
    | { kind: "already"; reservation: SentSlot }
    | { kind: "taken" }
  >("reserve", { code, slot });
  switch (result?.kind) {
    case undefined:
      return { kind: "invalid" };
    case "reserved":
      return { kind: "reserved", slot: toSlot(result.slot) };
    case "already":
      return { kind: "already", reservation: toSlot(result.reservation) };
    case "taken":
      return result;
  }
}

/** What a patient asked to hear about; an empty or null filter means any. */
export type SlotFilters = {
  operators: string[];
  weekdays: string[];
  dayPart: string | null;
  /** The first day wanted, as `2026-11-05`; null for any. */
  earliest: string | null;
  /** The last day wanted, when the request ends. */
  latest: string;
  /** Specific days, which take the place of `weekdays` and the range. */
  dates: string[];
};

export type NotifyResult =
  | { kind: "notifying"; filters: SlotFilters }
  /** The booking code is no longer valid. */
  | { kind: "invalid" };

/** Asks to hear about times matching the filter form's fields. */
export async function requestNotification(
  form: Record<string, unknown>,
): Promise<NotifyResult> {
  return await postBooking<NotifyResult>("notify", form) ?? { kind: "invalid" };
}

// ─── Display helpers ───────────────────────────────────────────

const PRACTICE_TIME_ZONE = "Australia/Perth";

/** The practice's wall-clock time now, whatever zone this app runs in. */
export const practiceNow = () =>
  Temporal.Now.plainDateTimeISO(PRACTICE_TIME_ZONE);

/** Identifies a time in a form, as generated times have no row of their own. */
export const slotKey = (slot: BookingSlot) =>
  `${slot.operator}|${slot.startTime}`;

/** "9:30 am" */
export const formatTime = (time: Temporal.PlainDateTime) =>
  time.toLocaleString("en-AU", { hour: "numeric", minute: "2-digit" });

/** "Tuesday 7 October" */
export const formatDay = (date: Temporal.PlainDate | Temporal.PlainDateTime) =>
  date.toLocaleString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

/** "45 min" or "1 hr 15 min" */
export function formatDuration(slot: BookingSlot) {
  const { minutes } = slot.startTime.until(slot.endTime, {
    largestUnit: "minute",
  });
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours} hr`, rest && `${rest} min`].filter(Boolean)
    .join(" ");
}

/** Slots grouped by day, keeping their order. */
export function groupByDay(slots: BookingSlot[]) {
  return Map.groupBy(slots, (slot) => slot.startTime.toPlainDate().toString())
    .entries()
    .map(([date, daySlots]) => ({
      date: Temporal.PlainDate.from(date),
      slots: daySlots,
    }))
    .toArray();
}

export function dayPart(time: Temporal.PlainDateTime) {
  if (time.hour < 12) return "morning";
  if (time.hour < 17) return "afternoon";
  return "evening";
}

const shortDate = (date: string) =>
  Temporal.PlainDate.from(date).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
  });

/** "Emma, Sara · Monday · Morning · until 4 Feb" */
export function describeFilters(filters: SlotFilters) {
  const part = filters.dayPart &&
    filters.dayPart[0].toUpperCase() + filters.dayPart.slice(1);
  const when = filters.dates.length
    ? filters.dates.map(shortDate).join(", ")
    : filters.earliest
    ? `${shortDate(filters.earliest)} to ${shortDate(filters.latest)}`
    : `until ${shortDate(filters.latest)}`;
  return [
    filters.operators.join(", "),
    filters.dates.length ? null : filters.weekdays.join(", "),
    part,
    when,
  ].filter(Boolean).join(" · ");
}
