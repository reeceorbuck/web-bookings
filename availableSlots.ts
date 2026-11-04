export type AvailableSlot = {
  operator: string;
  startTime: Temporal.PlainDateTime;
  endTime: Temporal.PlainDateTime;
};

/**
 * The times offered to a booking code's holder, earliest first, or null if the
 * web server doesn't accept the code. The web server decides both, and it's only
 * reachable over the tailnet.
 */
export async function getAvailableSlots(
  code: string,
): Promise<AvailableSlot[] | null> {
  const response = await fetch(
    `${Deno.env.get("WEBSERVER_URL")}/appointment/booking-options`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (response.status === 403) {
    await response.body?.cancel();
    return null;
  }
  if (!response.ok) {
    throw new Error(`Error getting available slots: ${response.status}`);
  }
  const { slots } = await response.json() as {
    slots: { operator: string; startTime: string; endTime: string }[];
  };
  return slots.map(({ operator, startTime, endTime }) => ({
    operator,
    startTime: Temporal.PlainDateTime.from(startTime),
    endTime: Temporal.PlainDateTime.from(endTime),
  }));
}
