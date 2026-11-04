export type AvailableSlot = {
  operator: string;
  startTime: Temporal.PlainDateTime;
  endTime: Temporal.PlainDateTime;
};

type SlotResponse = Record<
  string,
  { operator: string; startTime: string; endTime: string }[]
>;

/**
 * The times offered to patients, earliest first. The web server works them
 * out, and it's only reachable over the tailnet.
 */
export async function getAvailableSlots(): Promise<AvailableSlot[]> {
  const response = await fetch(
    `${Deno.env.get("WEBSERVER_URL")}/appointment/available?excludeHeld=true`,
    { signal: AbortSignal.timeout(10_000) },
  );
  if (!response.ok) {
    throw new Error(`Error getting available slots: ${response.status}`);
  }
  const { assorted } = await response.json() as { assorted: SlotResponse };
  return Object.values(assorted).flat()
    .map(({ operator, startTime, endTime }) => ({
      operator,
      startTime: Temporal.PlainDateTime.from(startTime),
      endTime: Temporal.PlainDateTime.from(endTime),
    }))
    .toSorted((a, b) =>
      Temporal.PlainDateTime.compare(a.startTime, b.startTime)
    );
}
