import type { PropsWithChildren } from "hono/jsx";
import { css, optimized } from "tinytools";
import {
  type BookingSlot,
  describeFilters,
  formatDay,
  formatDuration,
  formatTime,
  type NotifyResult,
  type ReserveResult,
} from "../onlineBookings.ts";
import { ButtonLink } from "./Button.tsx";

const tiny = optimized(import.meta.url);

const resultStyles = new tiny.Styles({
  card: css`
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 16px;
    padding-top: 40px;

    h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 650;
      line-height: 1.15;
      letter-spacing: -0.025em;
      text-wrap: balance;
    }

    p {
      margin: 0;
      max-width: 32rem;
      color: var(--muted);
    }

    result-icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--accent-soft);
      color: var(--accent-text);
      font-weight: 700;
    }

    &[data-tone="warn"] result-icon {
      background: var(--warn-soft);
      color: var(--warn-text);
    }
  `,
  summary: css`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 24px;
    width: 100%;
    margin: 4px 0;
    padding: 16px 0;
    border-block: 1px solid var(--line);

    dt {
      color: var(--muted);
    }

    dd {
      margin: 0;
      font-weight: 600;
    }
  `,
});

export type Outcome =
  | ReserveResult
  | NotifyResult
  | { kind: "unavailable" }
  | { kind: "unreachable" };

/** The page shown in place of the slot picker once there is nothing to choose. */
export function BookingResult(
  { result, code }: { result: Outcome; code?: string },
) {
  switch (result.kind) {
    case "reserved":
      return (
        <ResultCard icon="✓" title="You're booked in">
          <p>
            We've reserved this time for you. Our team will be in touch to
            confirm the details.
          </p>
          <AppointmentSummary slot={result.slot} />
        </ResultCard>
      );
    case "already":
      return (
        <ResultCard icon="✓" title="Your appointment is reserved">
          <p>
            You already have this time reserved. Need a different time? Give the
            practice a call and we'll sort it out.
          </p>
          <AppointmentSummary slot={result.reservation} />
        </ResultCard>
      );
    case "taken":
      return (
        <ResultCard icon="!" title="That time was just taken" tone="warn">
          <p>
            Someone else booked it a moment ago. There are still other times to
            choose from.
          </p>
          <ButtonLink
            href={`/${code}`}
          >
            See available times
          </ButtonLink>
        </ResultCard>
      );
    case "invalid":
      return (
        <ResultCard icon="!" title="This booking link has expired" tone="warn">
          <p>
            Booking links stop working once a new appointment is made. Please
            contact the practice and we'll send you a new one.
          </p>
        </ResultCard>
      );
    case "notifying":
      return (
        <ResultCard icon="✓" title="We'll let you know">
          <p>
            Our team will contact you when a time comes up that matches your
            request: <b>{describeFilters(result.filters)}</b>.
          </p>
          <ButtonLink
            href={`/${code}`}
          >
            Back to available times
          </ButtonLink>
        </ResultCard>
      );
    case "unreachable":
      return (
        <ResultCard icon="!" title="We couldn't get through" tone="warn">
          <p>
            Online booking can't be reached right now. Please try again shortly,
            or call the practice and we'll find a time that suits you.
          </p>
        </ResultCard>
      );
    case "unavailable":
      return (
        <ResultCard icon="…" title="No online times right now">
          <p>
            All of our online times have been taken. Please call the practice
            and we'll find a time that suits you.
          </p>
        </ResultCard>
      );
  }
}

async function ResultCard(
  props: PropsWithChildren<{ icon: string; title: string; tone?: "warn" }>,
) {
  const { styled } = await tiny.imports(resultStyles);
  return (
    <result-card class={styled.card} data-tone={props.tone}>
      <result-icon aria-hidden="true">{props.icon}</result-icon>
      <h2>{props.title}</h2>
      {props.children}
    </result-card>
  );
}

async function AppointmentSummary({ slot }: { slot: BookingSlot }) {
  const { styled } = await tiny.imports(resultStyles);
  return (
    <dl class={styled.summary}>
      <dt>When</dt>
      <dd>{formatDay(slot.startTime)}</dd>
      <dt>Time</dt>
      <dd>
        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}{" "}
        ({formatDuration(slot)})
      </dd>
      <dt>With</dt>
      <dd>{slot.operator}</dd>
    </dl>
  );
}
