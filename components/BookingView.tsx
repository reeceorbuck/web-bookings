import { css, optimized } from "tinytools";
import type { BookingOptions } from "../onlineBookings.ts";
import { BookingResult } from "./BookingResult.tsx";
import { Button } from "./Button.tsx";
import { SlotPicker } from "./SlotPicker.tsx";

const tiny = optimized(import.meta.url);

export const bookingFlowId = "booking-flow";

const viewStyles = new tiny.Styles({
  column: css`
    display: block;
    max-width: 46rem;
    margin: 0 auto;
    padding: 0 20px;

    booking-flow {
      display: block;
    }

    booking-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-top: 24px;

      svg {
        flex: none;
        width: 44px;
        height: 44px;
      }

      strong {
        display: block;
        font-size: 1.125rem;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -0.02em;
      }

      small {
        display: block;
        color: var(--muted);
        font-size: 0.8125rem;
      }
    }
  `,
  hero: css`
    display: block;
    margin: 20px 0 24px;
    padding: 28px;
    border-radius: 18px;
    background: light-dark(oklch(94.6% 0.055 168), oklch(27% 0.04 172));

    h1 {
      margin: 0;
      font-size: clamp(2rem, 6cqi, 2.75rem);
      font-weight: 650;
      line-height: 1.1;
      letter-spacing: -0.03em;
      text-wrap: balance;
    }

    p {
      margin: 16px 0 0;
      max-width: 32rem;
    }

    form {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    input {
      flex: 1 1 14rem;
      min-width: 0;
      padding: 11px 14px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      color: var(--ink);
      font: inherit;
    }
  `,
});

/** The patient booking page. */
export async function BookingView(props: { children?: unknown }) {
  const { styled } = await tiny.imports(viewStyles);
  return (
    <booking-column class={styled.column}>
      <booking-header>
        <PracticeLogo />
        <div>
          <strong>Sorrento Dental</strong>
          <small>Online booking</small>
        </div>
      </booking-header>
      <booking-flow id={bookingFlowId}>{props.children}</booking-flow>
    </booking-column>
  );
}

/** The practice website's logo, in its own colours in either theme. */
function PracticeLogo() {
  const ink = "oklch(27% 0.055 196)";
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="15"
        fill="oklch(88.5% 0.115 166)"
        stroke={ink}
        stroke-width="2.5"
      />
      <path
        d="M35 12.5C24 10 14.5 12.5 15.5 18.5C16.5 24.5 32.5 23 32.5 30C32.5 36 22.5 37.5 13 35.5"
        fill="none"
        stroke={ink}
        stroke-width="5.5"
        stroke-linecap="round"
      />
      <path
        d="M38 3c.5 3 2 4.5 5 5c-3 .5-4.5 2-5 5c-.5-3-2-4.5-5-5c3-.5 4.5-2 5-5z"
        fill="oklch(64% 0.2 357)"
      />
    </svg>
  );
}

/** Where a visitor without a working code enters one. */
export async function CodeForm({ rejected }: { rejected?: boolean }) {
  const { styled } = await tiny.imports(viewStyles);
  return (
    <booking-hero class={styled.hero}>
      <h1>Book your next check-up</h1>
      <p>
        {rejected
          ? "That code wasn't recognised. Check it and try again, or call the practice for a new one."
          : "Enter the booking code we sent you to see available times."}
      </p>
      <form method="get" action="/">
        <input
          name="code"
          required
          autocomplete="off"
          spellcheck={false}
          aria-label="Booking code"
        />
        <Button type="submit">Continue</Button>
      </form>
    </booking-hero>
  );
}

/** What the holder of a working code can do. */
export async function BookingFlow(
  { options, code }: { options: BookingOptions; code: string },
) {
  const { styled } = await tiny.imports(viewStyles);
  if (options.reservation) {
    return (
      <BookingResult
        result={{ kind: "already", reservation: options.reservation }}
      />
    );
  }
  return (
    <>
      <booking-hero class={styled.hero}>
        <h1>Book your next check-up</h1>
      </booking-hero>
      {options.slots.length
        ? (
          <SlotPicker
            slots={options.slots}
            operators={options.operators}
            code={code}
          />
        )
        : <BookingResult result={{ kind: "unavailable" }} />}
    </>
  );
}
