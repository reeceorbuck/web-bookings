import { css, optimized } from "tinytools";
import { type SignalEvent, signalTools } from "tinytools/handlers";
import {
  defaultEarliest,
  pickerSeedValues,
  pickerSignals,
  type PickerValues,
} from "./pickerSignals.ts";

const tiny = optimized(import.meta.url);

/** Choices that share one border, with the chosen one filled. */
const switchCss = css`
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--bg);

  label {
    border: 0;
    border-radius: 0;

    &:first-child {
      border-radius: 7px 0 0 7px;
    }

    &:last-child {
      border-left: 1px solid var(--line);
      border-radius: 0 7px 7px 0;
    }

    &:has(:checked) {
      background: var(--accent);
      color: white;
    }
  }
`;

const filterStyles = new tiny.Styles({
  panel: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px 0;
    border-block: 1px solid var(--line);

    fieldset {
      margin: 0;
      padding: 0;
      border: 0;

      &:disabled {
        opacity: 0.45;

        label {
          cursor: not-allowed;
        }
      }
    }

    legend {
      float: left;
      width: 6.5rem;
      padding: 6px 0;
      color: var(--muted);
      font-size: 0.875rem;

      @container (max-width: 520px) {
        float: none;
        padding: 0 0 6px;
      }
    }

    filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    label {
      position: relative;
      padding: 5px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;

      &:hover {
        border-color: var(--muted);
      }

      &:has(:checked) {
        border-color: var(--accent);
        background: var(--accent-soft);
        color: var(--accent-text);
        font-weight: 600;
      }

      &:has(:focus-visible) {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
    }

    input[type="radio"],
    input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    input[type="date"] {
      padding: 4px 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 0.875rem;

      &:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
    }

    /* One control: the choices share a border, and the chosen one is filled. */
    date-switch {
      ${switchCss} position: relative;
      z-index: 1;
      margin-left: 12px;
    }

    /* What the switch chose, in a box the switch overlaps the top edge of. */
    date-fields {
      display: block;
      margin-top: -28px;
      margin-left: 6.5rem;
      padding: 30px 12px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: light-dark(oklch(96.5% 0.008 190), oklch(23.5% 0.006 190));

      @container (max-width: 520px) {
        margin-left: 0;
      }

      > [hidden] {
        display: none;
      }

      input[type="date"] {
        background: var(--bg);
      }
    }

    date-range {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 8px;
      color: var(--muted);
      font-size: 0.875rem;

      @container (max-width: 520px) {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
      }
    }

    /* A date input has no placeholder, so this shows one over it until focused. */
    add-day {
      position: relative;
      display: inline-flex;

      input[type="date"] {
        box-sizing: border-box;
        min-width: 8rem;
        min-height: 33px;

        &:not(:focus)::-webkit-datetime-edit {
          color: transparent;
        }

        &:focus + span {
          visibility: hidden;
        }
      }

      span {
        position: absolute;
        inset-block: 0;
        left: 11px;
        display: flex;
        align-items: center;
        color: var(--muted);
        font-size: 0.875rem;
        pointer-events: none;
      }
    }

    day-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      &:empty {
        display: none;
      }

      button {
        padding: 5px 10px;
        border: 1px solid var(--accent);
        border-radius: 8px;
        background: var(--accent-soft);
        color: var(--accent-text);
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;

        &:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      }
    }

    day-problem {
      align-self: center;
      color: var(--warn-text);
      font-size: 0.875rem;
    }

    filter-summary {
      display: flex;
      align-items: baseline;
      gap: 12px;
      padding-top: 4px;
      color: var(--muted);
      font-size: 0.875rem;

      button {
        padding: 0;
        border: 0;
        background: none;
        color: var(--accent-text);
        font: inherit;
        font-weight: 600;
        cursor: pointer;

        &[hidden] {
          display: none;
        }
      }
    }
  `,
});

const choiceTools = new tiny.Handlers({
  /** Checks a group's controls for its value: one choice, or a list ("Any" when empty). */
  showChoices(group: HTMLElement, value: string | readonly string[]): void {
    for (const box of group.querySelectorAll("input")) {
      box.checked = typeof value === "string"
        ? box.value === value
        : box.value
        ? value.includes(box.value)
        : !value.length;
    }
  },
});

export const filterHandlers = new tiny.Handlers(
  [choiceTools, pickerSignals],
  ({ fn, signal }) => ({
    /** Puts every filter back; the controls follow their signals. */
    clearFilters(this: HTMLElement) {
      signal.operators.forInstance(this).value = [];
      signal.weekdays.forInstance(this).value = [];
      signal.daypart.forInstance(this).value = "";
      signal.dates.forInstance(this).value = [];
      signal.dateMode.forInstance(this).value = "range";
      signal.dayProblem.forInstance(this).value = "";
      signal.earliest.forInstance(this).value = signal.startOfRange
        .forInstance(this).value;
      signal.latest.forInstance(this).value = signal.endOfRange
        .forInstance(this).value;
    },

    /** Adds the day entered to the specific days, and empties the input again. */
    addDay(this: HTMLInputElement) {
      if (!this.value || !this.validity.valid) return;
      const weekend = [0, 6].includes(new Date(this.value).getUTCDay());
      signal.dayProblem.forInstance(this).value = weekend
        ? "We're closed on weekends, so please choose a weekday."
        : "";
      if (!weekend) {
        const dates = signal.dates.forInstance(this);
        dates.value = [...new Set([...dates.value, this.value])].sort();
      }
      this.value = "";
    },

    /** Empties a date that wasn't added, so the placeholder shows alone again. */
    emptyDay(this: HTMLInputElement) {
      this.value = "";
    },

    /** Takes off the specific day whose chip was clicked. */
    removeDay(this: HTMLElement, e: Event) {
      const day = (e.target as Element).closest("button")?.dataset.day;
      if (!day) return;
      const dates = signal.dates.forInstance(this);
      dates.value = dates.value.filter((date) => date !== day);
      signal.dayProblem.forInstance(this).value = "";
    },

    /** Shows the specific days as chips. */
    showDays(this: HTMLElement, e: SignalEvent) {
      this.replaceChildren(
        ...(e.signal.value as string[]).map((day) => {
          const name = (options: Intl.DateTimeFormatOptions) =>
            new Date(day).toLocaleDateString("en-AU", {
              timeZone: "UTC",
              ...options,
            });
          const chip = document.createElement("button");
          chip.type = "button";
          chip.dataset.day = day;
          chip.textContent = `${
            name({ weekday: "short", day: "numeric", month: "short" })
              .replace(",", "")
          } ×`;
          chip.ariaLabel = `Remove ${
            name({ weekday: "long", day: "numeric", month: "long" })
          }`;
          return chip;
        }),
      );
    },

    /** Writes a group of checkboxes to its signal; "Any" clears the others. */
    pickMany(this: HTMLFieldSetElement, e: Event) {
      const box = e.target as HTMLInputElement;
      const values = box.value
        ? [...this.querySelectorAll("input:checked")]
          .map((input) => (input as HTMLInputElement).value)
          .filter(Boolean)
        : [];
      const filter = this.dataset.filter === "operators"
        ? signal.operators
        : signal.weekdays;
      filter.forInstance(this).value = values;
      // Unticking "Any" with nothing else ticked changes no signal.
      fn.showChoices(this, values);
    },

    /** Checks the controls for the filter's signal. */
    syncChoices(this: HTMLFieldSetElement, e: SignalEvent) {
      // A `disabled` binding on the fieldset also fires this, with a boolean.
      if (typeof e.signal.value === "boolean") return;
      fn.showChoices(this, e.signal.value as string | readonly string[]);
    },
  }),
);

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * The filters by clinician, day and time of day, each writing a signal. They
 * offer every choice, not only those with a time now, as a patient can ask to
 * be notified of a time that isn't offered yet.
 */
export async function FilterPanel(
  { operators, values, timeCount }: {
    operators: string[];
    /** What the controls first show. */
    values: PickerValues;
    /** How many times are listed beside it, if any are. */
    timeCount?: number;
  },
) {
  const { fn, signal, styled } = await tiny.imports(
    filterStyles,
    filterHandlers,
    pickerSignals.withInputs(undefined, pickerSeedValues(values)),
    signalTools,
  );
  const firstDay = defaultEarliest();
  // Radios outside a form group by name across the page, which can hold several
  // of these. The hidden `FilterFields` are what submit, so the name is free.
  const radioGroup = Math.random().toString(36).slice(2, 8);

  const groups = [
    {
      legend: "Clinician",
      name: "operators",
      filter: signal.operators,
      many: true,
      options: operators.map((operator) => ({
        value: operator,
        label: operator,
      })),
    },
    {
      legend: "Day",
      name: "weekdays",
      filter: signal.weekdays,
      many: true,
      disabled: signal.hasDates,
      options: weekdays.map((day) => ({ value: day, label: day.slice(0, 3) })),
    },
    {
      legend: "Time of day",
      name: "daypart",
      filter: signal.daypart,
      options: [
        { value: "morning", label: "Morning" },
        { value: "afternoon", label: "Afternoon" },
      ],
    },
  ].filter((group) => group.options.length > 1);

  return (
    <filter-panel class={styled.panel}>
      {groups.map(({ legend, name, filter, many, disabled, options }) => (
        <fieldset
          {
            // Spread, as precompile writes a direct `disabled` into the template.
            ...(disabled ? { disabled } : {})
          }
          data-filter={name}
          onChange={many ? fn.pickMany : fn.signals.update(filter)}
          // Saved filters show as this connects, as first values are the defaults.
          onConnect={[fn.signals.subscribe(filter), fn.fireSelfSignal]}
          onSignal={fn.syncChoices}
        >
          <legend>{legend}</legend>
          <filter-options>
            {[{ value: "", label: "Any" }, ...options].map((option) => (
              <label>
                <input
                  type={many ? "checkbox" : "radio"}
                  name={`${name}-${radioGroup}`}
                  data-filter={name}
                  value={option.value}
                  checked={many
                    ? (option.value
                      ? values[name as "operators"].includes(option.value)
                      : !values[name as "operators"].length)
                    : option.value === values.daypart}
                />
                {option.label}
              </label>
            ))}
          </filter-options>
        </fieldset>
      ))}
      <fieldset
        onChange={fn.signals.update(signal.dateMode)}
        onConnect={[fn.signals.subscribe(signal.dateMode), fn.fireSelfSignal]}
        onSignal={fn.syncChoices}
      >
        <legend>Dates</legend>
        <date-switch>
          {[
            { value: "range", label: "Date range" },
            { value: "days", label: "Specific dates" },
          ].map((option) => (
            <label>
              <input
                type="radio"
                name={`dateMode-${radioGroup}`}
                data-filter="dateMode"
                value={option.value}
                checked={option.value === values.dateMode}
              />
              {option.label}
            </label>
          ))}
        </date-switch>
      </fieldset>
      <date-fields>
        <date-range hidden={signal.usingDays}>
          From
          <input
            type="date"
            aria-label="From"
            min={firstDay}
            value={signal.earliest}
            onInput={fn.signals.update(signal.earliest)}
          />
          to
          <input
            type="date"
            aria-label="To"
            min={firstDay}
            value={signal.latest}
            onInput={fn.signals.update(signal.latest)}
          />
        </date-range>
        <filter-options hidden={signal.usingRange}>
          <add-day>
            <input
              type="date"
              aria-label="Add a specific date"
              min={firstDay}
              onChange={fn.addDay}
              onBlur={fn.emptyDay}
            />
            <span aria-hidden="true">Add date…</span>
          </add-day>
          <day-chips
            onConnect={[fn.signals.subscribe(signal.dates), fn.fireSelfSignal]}
            onSignal={fn.showDays}
            onClick={fn.removeDay}
          />
          <day-problem>{signal.dayProblem}</day-problem>
        </filter-options>
      </date-fields>
      <filter-summary aria-live="polite">
        {timeCount !== undefined && (
          <span>
            {signal.matchLabel.withInitial(
              timeCount === 1 ? "1 time" : `${timeCount} times`,
            )}
          </span>
        )}
        <button
          type="button"
          hidden={signal.unfiltered}
          onClick={fn.clearFilters}
        >
          Clear filters
        </button>
      </filter-summary>
    </filter-panel>
  );
}

/** The filters as a form submits them. */
export async function FilterFields({ values }: { values: PickerValues }) {
  const { signal } = await tiny.imports(pickerSignals);
  return (
    <>
      <input
        type="hidden"
        name="operators"
        value={signal.operatorsValue.withInitial(values.operators.join(","))}
      />
      <input
        type="hidden"
        name="weekdays"
        value={signal.weekdaysValue.withInitial(values.weekdays.join(","))}
      />
      <input
        type="hidden"
        name="daypart"
        value={signal.daypart.withInitial(values.daypart)}
      />
      <input
        type="hidden"
        name="earliest"
        value={signal.activeEarliest.withInitial(values.earliest)}
      />
      <input
        type="hidden"
        name="latest"
        value={signal.activeLatest.withInitial(values.latest)}
      />
      <input
        type="hidden"
        name="dates"
        value={signal.datesValue.withInitial(values.dates.join(","))}
      />
    </>
  );
}
