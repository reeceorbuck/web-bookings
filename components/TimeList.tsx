import { css, optimized } from "tinytools";
import {
  type BookingSlot,
  dayPart,
  formatDay,
  formatTime,
  groupByDay,
  practiceNow,
  slotKey,
} from "../onlineBookings.ts";
import { Button } from "./Button.tsx";
import { filterHandlers } from "./FilterPanel.tsx";
import { pickerSignals } from "./pickerSignals.ts";

const tiny = optimized(import.meta.url);

const timeStyles = new tiny.Styles({
  list: css`
    display: block;

    week-group {
      display: block;
      padding-top: 28px;

      &[hidden] {
        display: none;
      }
    }

    h2 {
      margin: 0 0 4px;
      font-size: 1rem;
      font-weight: 650;
    }

    day-row {
      display: grid;
      grid-template-columns: 6.5rem 1fr;
      gap: 12px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);

      @container (max-width: 520px) {
        grid-template-columns: 1fr;
      }

      &[hidden] {
        display: none;
      }
    }

    h3 {
      display: flex;
      flex-direction: column;
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      line-height: 1.3;

      small {
        color: var(--muted);
        font-size: 0.8125rem;
        font-weight: 400;
      }
    }

    time-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
      gap: 8px;
    }

    label {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      line-height: 1.3;
      cursor: pointer;

      &[hidden] {
        display: none;
      }

      &:hover {
        border-color: var(--ink);
      }

      &:has(:checked) {
        border-color: var(--ink);
        background: var(--ink);
        color: var(--bg);

        span {
          color: inherit;
        }
      }

      &:has(:focus-visible) {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
    }

    strong {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    span {
      overflow: hidden;
      color: var(--muted);
      font-size: 0.8125rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    no-matches {
      display: flex;
      flex-direction: column;
      align-items: start;
      gap: 12px;
      padding: 32px 0;
      color: var(--muted);

      &[hidden] {
        display: none;
      }
    }
  `,
});

const timeHandlers = new tiny.Handlers(pickerSignals, ({ signal }) => ({
  /** Shows the times matching every filter, and the days and weeks holding them. */
  applyFilter(this: HTMLElement) {
    const days = signal.activeDates.forInstance(this).value;
    const earliest = signal.activeEarliest.forInstance(this).value;
    const latest = signal.activeLatest.forInstance(this).value;
    const operators = signal.operators.forInstance(this).value;
    // Specific days take the place of the weekdays and the range.
    const weekdays = days.length ? [] : signal.weekdays.forInstance(this).value;
    const daypart = signal.daypart.forInstance(this).value;

    let matches = 0;
    for (const time of this.querySelectorAll("label")) {
      const day = time.dataset.date ?? "";
      const shown = (!operators.length ||
        operators.includes(time.dataset.operator ?? "")) &&
        (!weekdays.length || weekdays.includes(time.dataset.weekday ?? "")) &&
        (!daypart || time.dataset.daypart === daypart) && (days.length
          ? days.includes(day)
          : (!earliest || day >= earliest) && (!latest || day <= latest));
      time.hidden = !shown;
      if (shown) {
        matches++;
      }
      const input = time.control as HTMLInputElement | null;
      if (!shown && input?.checked) {
        // A hidden time can't stay selected.
        input.checked = false;
        signal.chosen.forInstance(this).value = "";
      }
    }
    for (
      const group of this.querySelectorAll<HTMLElement>("day-row, week-group")
    ) {
      group.hidden = !group.querySelector("label:not([hidden])");
    }
    signal.matchCount.forInstance(this).value = matches;
  },

  /** Records the chosen time's summary. */
  chooseTime(this: HTMLElement, e: Event) {
    const input = e.target as HTMLInputElement;
    signal.chosen.forInstance(this).value = input.dataset.summary ?? "";
  },
}));

/** The times to choose from, by week and day, following the filter signals. */
export async function TimeList({ slots }: { slots: BookingSlot[] }) {
  const { fn, signal, styled } = await tiny.imports(
    timeStyles,
    timeHandlers,
    filterHandlers,
    pickerSignals,
  );
  return (
    <slot-days
      class={styled.list}
      onConnect={fn.signals.subscribe(signal.filter)}
      onSignal={fn.applyFilter}
      onChange={fn.chooseTime}
    >
      {groupByWeek(slots).map(({ label, slots }) => (
        <week-group>
          <h2>{label}</h2>
          {groupByDay(slots).map(({ date, slots }) => (
            <day-row>
              <h3>
                {date.toLocaleString("en-AU", { weekday: "long" })}
                <small>
                  {date.toLocaleString("en-AU", {
                    day: "numeric",
                    month: "short",
                  })}
                </small>
              </h3>
              <time-grid>
                {slots.map((slot) => <TimeOption slot={slot} />)}
              </time-grid>
            </day-row>
          ))}
        </week-group>
      ))}
      <no-matches hidden={signal.hasMatches}>
        No times match those filters.
        <Button type="button" variant="quiet" onClick={fn.clearFilters}>
          Show all times
        </Button>
      </no-matches>
    </slot-days>
  );
}

function TimeOption({ slot }: { slot: BookingSlot }) {
  return (
    <label
      data-operator={slot.operator}
      data-weekday={slot.startTime.toLocaleString("en-AU", { weekday: "long" })}
      data-daypart={dayPart(slot.startTime)}
      data-date={slot.startTime.toPlainDate().toString()}
    >
      <input
        type="radio"
        name="slot"
        value={slotKey(slot)}
        required
        data-summary={`${formatDay(slot.startTime)} at ${
          formatTime(slot.startTime)
        } with ${slot.operator}`}
      />
      <strong>{formatTime(slot.startTime)}</strong>
      <span>{slot.operator}</span>
    </label>
  );
}

/** Slots grouped into Monday-to-Sunday weeks, labelled relative to today. */
function groupByWeek(slots: BookingSlot[]) {
  const today = practiceNow().toPlainDate();
  const thisMonday = today.subtract({ days: today.dayOfWeek - 1 });

  return Map.groupBy(slots, (slot) => {
    const date = slot.startTime.toPlainDate();
    return date.subtract({ days: date.dayOfWeek - 1 }).toString();
  }).entries().map(([monday, weekSlots]) => {
    const weeksAhead = thisMonday.until(monday).days / 7;
    const label = weeksAhead === 0
      ? "This week"
      : weeksAhead === 1
      ? "Next week"
      : `Week of ${
        Temporal.PlainDate.from(monday).toLocaleString("en-AU", {
          day: "numeric",
          month: "long",
        })
      }`;
    return { label, slots: weekSlots };
  }).toArray();
}
