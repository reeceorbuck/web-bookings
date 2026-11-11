import { optimized } from "tinytools";
import { practiceNow } from "../onlineBookings.ts";

const tiny = optimized(import.meta.url);

/**
 * The range a picker starts with: from tomorrow, the first day that can be
 * chosen, for three months from today.
 */
export const defaultEarliest = () =>
  practiceNow().toPlainDate().add({ days: 1 }).toString();
export const defaultLatest = () =>
  practiceNow().toPlainDate().add({ months: 3 }).toString();

/** What the filter controls show, as they first render. */
export type PickerValues = {
  operators: string[];
  weekdays: string[];
  daypart: string;
  earliest: string;
  latest: string;
  dates: string[];
  dateMode: "range" | "days";
};

/** The controls' default values. */
export const pickerValues = (): PickerValues => ({
  operators: [],
  weekdays: [],
  daypart: "",
  earliest: defaultEarliest(),
  latest: defaultLatest(),
  dates: [],
  dateMode: "range",
});

/**
 * One picker's filters and chosen time; the `<slot-picker>` is the instance
 * root, seeded with the default date range, so a new picker starts as the
 * server renders it and a cached one keeps its own state. Everything on the
 * page follows these: the filter controls, the list of times, the count, both
 * empty states and what "Notify me" asks for.
 */
export const pickerSignals = new tiny.Signals(
  ({ Signal, Computed, Scope }) => {
    const picker = new Scope(() => {
      /** The filters, empty for any. */
      const operators = new Signal<readonly string[]>([]);
      const weekdays = new Signal<readonly string[]>([]);
      const daypart = new Signal<string>("");
      const operatorsValue = new Computed(() => operators.value.join(","));
      const weekdaysValue = new Computed(() => weekdays.value.join(","));
      /** The range of days wanted, and the defaults it starts from. */
      const earliest = new Signal<string>("");
      const latest = new Signal<string>("");
      const startOfRange = new Signal<string>("");
      const endOfRange = new Signal<string>("");
      /** Specific days, which take the place of the weekdays and the range. */
      const dates = new Signal<readonly string[]>([]);
      /** Which of those the dates are chosen by; the other keeps its value, unused. */
      const dateMode = new Signal<string>("range");
      const usingRange = new Computed(() => dateMode.value === "range");
      const usingDays = new Computed(() => dateMode.value === "days");
      const activeDates = new Computed(() =>
        usingDays.value ? dates.value : []
      );
      const activeEarliest = new Computed(() =>
        usingRange.value ? earliest.value : startOfRange.value
      );
      const activeLatest = new Computed(() =>
        usingRange.value ? latest.value : endOfRange.value
      );
      const hasDates = new Computed(() => activeDates.value.length > 0);
      const datesValue = new Computed(() => activeDates.value.join(","));
      /** Why the day just entered couldn't be added. */
      const dayProblem = new Signal<string>("");
      /** All the filters as one value, for the list to subscribe to. */
      const filter = new Computed(() =>
        [
          operatorsValue.value,
          weekdaysValue.value,
          daypart.value,
          activeEarliest.value,
          activeLatest.value,
          datesValue.value,
        ].join("|")
      );
      /** The default range isn't a filter of its own. */
      const unfiltered = new Computed(() =>
        !operators.value.length && !weekdays.value.length && !daypart.value &&
        !activeDates.value.length &&
        activeEarliest.value === startOfRange.value &&
        activeLatest.value === endOfRange.value
      );
      /** The times the filters leave, null until they first apply. */
      const matchCount = new Signal<number | null>(null);
      const hasMatches = new Computed(() => matchCount.value !== 0);
      const matchLabel = new Computed(() =>
        matchCount.value === 1 ? "1 time" : `${matchCount.value} times`
      );
      /** The chosen time's summary; empty until one is chosen. */
      const chosen = new Signal<string>("");
      const nothingChosen = new Computed(() => !chosen.value);
      const rangeBackwards = new Computed(() =>
        !activeDates.value.length && activeEarliest.value !== "" &&
        activeLatest.value !== "" &&
        activeEarliest.value > activeLatest.value
      );
      const cannotNotify = new Computed(() =>
        unfiltered.value || rangeBackwards.value
      );
      /** What the filters ask for, in words. */
      const wanted = new Computed(() => {
        const short = (date: string) =>
          new Date(date).toLocaleDateString("en-AU", {
            timeZone: "UTC",
            day: "numeric",
            month: "short",
          });
        const part = daypart.value && daypart.value[0].toUpperCase() +
            daypart.value.slice(1);
        const custom = activeEarliest.value !== startOfRange.value &&
          activeEarliest.value;
        const when = activeDates.value.length
          ? activeDates.value.map(short).join(", ")
          : activeLatest.value === ""
          ? custom && `from ${short(custom)}`
          : custom
          ? `${short(custom)} to ${short(activeLatest.value)}`
          : `until ${short(activeLatest.value)}`;
        return [
          operators.value.join(", "),
          activeDates.value.length ? "" : weekdays.value.join(", "),
          part,
          when,
        ].filter(Boolean).join(" · ");
      });
      const notifyHint = new Computed(() =>
        unfiltered.value
          ? "Choose what suits you above and we can let you know when a matching time comes up."
          : rangeBackwards.value
          ? "Your From date is after your To date."
          : `We can let you know when a time comes up for: ${wanted.value}.`
      );
      return {
        operators,
        weekdays,
        operatorsValue,
        weekdaysValue,
        daypart,
        earliest,
        latest,
        startOfRange,
        endOfRange,
        dates,
        dateMode,
        usingRange,
        usingDays,
        activeDates,
        activeEarliest,
        activeLatest,
        hasDates,
        datesValue,
        dayProblem,
        filter,
        unfiltered,
        matchCount,
        hasMatches,
        matchLabel,
        chosen,
        nothingChosen,
        cannotNotify,
        notifyHint,
      };
    });
    return picker;
  },
);

/**
 * What a picker's instance starts from, given these values: for its root's
 * `tt-seed`, and for `pickerSignals.withInputs()` so the server renders its
 * first text from the same values.
 */
export const pickerSeedValues = (values: PickerValues) => ({
  ...values,
  startOfRange: defaultEarliest(),
  endOfRange: defaultLatest(),
});
