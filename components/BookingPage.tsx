import { css, optimized } from "tinytools";

const tiny = optimized(import.meta.url);

const bookingColours = css`
  --ink: light-dark(oklch(27% 0.055 196), oklch(93% 0.02 196));
  --muted: light-dark(oklch(46% 0.03 196), oklch(72% 0.02 196));
  --line: light-dark(oklch(90% 0.012 190), oklch(31% 0.012 190));
  --bg: light-dark(oklch(99% 0.004 170), oklch(20% 0.006 196));
  --surface: light-dark(oklch(100% 0 0), oklch(23.5% 0.008 196));
  --accent: oklch(52% 0.11 172);
  --accent-text: light-dark(oklch(45% 0.1 172), oklch(78% 0.11 172));
  --accent-soft: light-dark(oklch(95% 0.04 168), oklch(27% 0.03 172));
  --warn-text: light-dark(oklch(45% 0.11 60), oklch(78% 0.12 60));
  --warn-soft: light-dark(oklch(96% 0.04 80), oklch(26% 0.03 80));
`;

const pageStyles = new tiny.Styles({
  page: css`
    ${bookingColours} display: block;
    height: 100vh;
    overflow-y: auto;
    container-type: inline-size;
    background: var(--bg);
    color: var(--ink);
    font-family: system-ui, sans-serif;
    line-height: 1.5;

    #booking-view {
      display: block;
    }

    booking-footer {
      display: block;
      padding: 48px 20px 32px;
      color: var(--muted);
      font-size: 0.8rem;
      text-align: center;
    }
  `,
});

/** The page around the booking view, and the colours everything inside uses. */
export async function BookingPage(props: { children?: unknown }) {
  const { styled } = await tiny.imports(pageStyles);
  return (
    <booking-page class={styled.page}>
      <booking-view id="booking-view">{props.children}</booking-view>
      <booking-footer>Sorrento Dental · Online booking</booking-footer>
    </booking-page>
  );
}
