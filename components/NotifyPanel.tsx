import { css, optimized } from "tinytools";
import { signalTools } from "tinytools/handlers";
import { Button } from "./Button.tsx";
import { FilterFields } from "./FilterPanel.tsx";
import { pickerSignals, type PickerValues } from "./pickerSignals.ts";

const tiny = optimized(import.meta.url);

const notifyStyles = new tiny.Styles({
  panel: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 20px;
    margin-top: 28px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);

    notify-text {
      display: flex;
      flex: 1 1 18rem;
      flex-direction: column;
      gap: 2px;
    }

    strong {
      font-weight: 650;
    }

    span {
      color: var(--muted);
      font-size: 0.9375rem;
      text-wrap: pretty;
    }

    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `,
});

/** Asks to hear about a time matching the filters, when none here suits. */
export async function NotifyPanel(
  { code, values }: { code: string; values: PickerValues },
) {
  const { fn, signal, styled } = await tiny.imports(
    notifyStyles,
    pickerSignals,
    signalTools,
  );
  return (
    <form
      class={styled.panel}
      method="post"
      action="/api/notify"
      data-nav-redirect="true"
    >
      <input type="hidden" name="code" value={code} />
      <FilterFields values={values} />
      <notify-text>
        <strong>Can't find a time that suits?</strong>
        <span>{signal.notifyHint}</span>
      </notify-text>
      <Button
        type="submit"
        variant="quiet"
        disabled={signal.cannotNotify}
        onConnect={fn.fireSelfSignal}
      >
        Notify me
      </Button>
    </form>
  );
}
