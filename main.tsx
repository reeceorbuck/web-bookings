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

    form {
      display: flex;
      gap: 8px;
    }

    input {
      flex: 1;
      min-width: 0;
      padding: 8px;
      font: inherit;
    }

    button {
      padding: 8px 16px;
      font: inherit;
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

function CodeForm({ rejected }: { rejected?: boolean }) {
  return (
    <>
      <h1>Book an appointment</h1>
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
          aria-label="Booking code"
        />
        <button type="submit">Continue</button>
      </form>
    </>
  );
}

const title = "Book an appointment · Sorrento Dental";

app.get("/", (c) => {
  const code = c.req.query("code")?.trim();
  if (code) return c.redirect(`/${encodeURIComponent(code)}`);
  return c.render(<CodeForm />, { title });
});

// Only what a code can contain, so requests like /favicon.ico never get here.
app.get("/:code{[A-Za-z0-9_-]+}", async (c) => {
  const slots = await getAvailableSlots(c.req.param("code")).catch((error) => {
    console.error(error);
    return "unavailable" as const;
  });
  if (slots === "unavailable") {
    c.status(502);
    return c.render(
      <>
        <h1>Available appointments</h1>
        <p>Available times can't be loaded right now.</p>
      </>,
      { title },
    );
  }
  if (!slots) {
    c.status(403);
    return c.render(<CodeForm rejected />, { title });
  }
  return c.render(
    <>
      <h1>Available appointments</h1>
      <Slots slots={slots} />
    </>,
    { title },
  );
});
