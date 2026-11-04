import { Hono } from "hono";
import { css, optimized } from "tinytools";
import { type AvailableSlot, getAvailableSlots } from "./availableSlots.ts";

const tiny = optimized(import.meta.url);

declare module "hono" {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: { title?: string },
    ): Response | Promise<Response>;
  }
}

const pageStyles = new tiny.Styles({
  page: css`
    color-scheme: light dark;
    min-height: 100vh;
    margin: 0;
    background: light-dark(oklch(99% 0.004 170), oklch(20% 0.006 196));
    color: light-dark(oklch(27% 0.055 196), oklch(93% 0.02 196));
    font-family: system-ui, sans-serif;
    line-height: 1.5;

    main {
      max-width: 46rem;
      margin: 0 auto;
      padding: 24px 20px;
    }

    h2 {
      margin: 24px 0 8px;
      font-size: 1rem;
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-top: 1px solid
        light-dark(oklch(90% 0.012 190), oklch(31% 0.012 190));
    }
  `,
});

const dayFormat: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
};
const timeFormat: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

function Slots({ slots }: { slots: AvailableSlot[] }) {
  if (!slots.length) return <p>No times are available right now.</p>;
  const days = Map.groupBy(
    slots,
    (slot) => slot.startTime.toLocaleString("en-AU", dayFormat),
  );
  return (
    <>
      {[...days].map(([day, daySlots]) => (
        <section>
          <h2>{day}</h2>
          <ul>
            {daySlots.map((slot) => (
              <li>
                <span>
                  {slot.startTime.toLocaleString("en-AU", timeFormat)}
                </span>
                <span>{slot.operator}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export const app = new Hono()
  .use(...tiny.middleware.core())
  .use(tiny.middleware.layout(async ({ children }) => {
    const { styled } = await tiny.imports(pageStyles);
    return (
      <body class={styled.page}>
        <main>{children}</main>
      </body>
    );
  }));

app.get("/health", (c) => c.text("ok"));

app.get("/", async (c) => {
  const slots = await getAvailableSlots().catch((error) => {
    console.error(error);
    return null;
  });
  if (!slots) c.status(502);
  return c.render(
    <>
      <h1>Available appointments</h1>
      {slots
        ? <Slots slots={slots} />
        : <p>Available times can't be loaded right now.</p>}
    </>,
    { title: "Available appointments · Sorrento Dental" },
  );
});
