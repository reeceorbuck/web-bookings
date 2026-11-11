import { type Context, Hono } from "hono";
import { css, optimized } from "tinytools";
import { PartialReplace } from "tinytools/components";
import {
  applyNavigationHandlers,
  navigationTools,
  processIncomingDataTools,
} from "tinytools/handlers";
import { BookingPage } from "./components/BookingPage.tsx";
import { BookingResult, type Outcome } from "./components/BookingResult.tsx";
import {
  BookingFlow,
  bookingFlowId,
  BookingView,
  CodeForm,
} from "./components/BookingView.tsx";
import { BookingClientRoutes } from "./components/ClientRoutes.tsx";
import {
  getBookingOptions,
  requestNotification,
  reserveSlot,
} from "./onlineBookings.ts";

const tiny = optimized(import.meta.url);

declare module "hono" {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: { title?: string },
    ): Response | Promise<Response>;
  }
}

const bodyStyles = new tiny.Styles({
  body: css`
    color-scheme: light dark;
    margin: 0;
  `,
});

export const app = new Hono()
  .use(...tiny.middleware.core())
  .use(tiny.middleware.layout(async ({ children }) => {
    const { fn, styled } = await tiny.imports(
      bodyStyles,
      applyNavigationHandlers,
      navigationTools,
      processIncomingDataTools,
    );
    return (
      <body
        class={styled.body}
        onLoad={[
          fn.applyNavigationListener,
          fn.applyCurrentEntryChangeListener,
          fn.applyIncomingDataListener,
        ]}
        onNavigate={fn.handleNavigate}
        onIncomingData={fn.appendIncomingHtml}
      >
        <BookingPage>{children}</BookingPage>
        <BookingClientRoutes />
      </body>
    );
  }));

app.get("/health", (c) => c.text("ok"));

const title = "Book online · Sorrento Dental";

/**
 * The whole page or just what changes, for a link or form within the site. A
 * failed status is only for a whole page, as navigation within the site won't
 * show the body of one.
 */
function renderView(c: Context, content: unknown, status?: 403 | 502) {
  const sourcePath = c.req.header("source-url");
  if (status && !sourcePath) c.status(status);
  return c.render(
    <PartialReplace id="booking-view" fullPageLoad={!sourcePath}>
      <BookingView>{content}</BookingView>
    </PartialReplace>,
    { title },
  );
}

async function renderCode(c: Context, code: string) {
  const options = await getBookingOptions(code).catch((error) => {
    console.error(error);
    return "unreachable" as const;
  });
  if (options === "unreachable") {
    return renderView(c, <BookingResult result={{ kind: options }} />, 502);
  }
  if (!options) return renderView(c, <CodeForm rejected />, 403);
  return renderView(c, <BookingFlow options={options} code={code} />);
}

/** Only what a code can contain, so requests like /favicon.ico never get here. */
const codeShape = /^[A-Za-z0-9_-]+$/;

app.get("/", (c) => {
  const code = c.req.query("code")?.trim();
  if (!code) return renderView(c, <CodeForm />);
  if (!codeShape.test(code)) return renderView(c, <CodeForm rejected />, 403);

  // The code box submits ?code=…; show it as /<code>.
  const path = `/${code}`;
  if (!c.req.header("source-url")) return c.redirect(path);
  c.header("X-spa-redirect", path);
  return renderCode(c, code);
});

app.get("/:code{[A-Za-z0-9_-]+}", (c) => renderCode(c, c.req.param("code")));

/** The form's result in place of the picker, or word that it couldn't be saved. */
async function renderResult(
  c: Context,
  code: string,
  result: Promise<Outcome>,
) {
  const outcome = await result.catch((error): Outcome => {
    console.error(error);
    return { kind: "unreachable" };
  });
  return c.render(
    <PartialReplace id={bookingFlowId}>
      <BookingResult result={outcome} code={code} />
    </PartialReplace>,
    { title },
  );
}

/** Reserves a time for the patient the booking code belongs to. */
app.post("/api/reserve", async (c) => {
  const { code, slot } = await c.req.parseBody();
  return renderResult(c, String(code), reserveSlot(String(code), String(slot)));
});

/** Asks to hear about times matching the filters, for the code's patient. */
app.post("/api/notify", async (c) => {
  const form = await c.req.parseBody();
  return renderResult(c, String(form.code), requestNotification(form));
});
