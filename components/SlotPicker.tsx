import { css, optimized } from "tinytools";
import { DialogSignalComponent } from "tinytools/library";
import type { BookingSlot } from "../onlineBookings.ts";
import { Button } from "./Button.tsx";
import { FilterPanel } from "./FilterPanel.tsx";
import { NotifyPanel } from "./NotifyPanel.tsx";
import {
  pickerSeedValues,
  pickerSignals,
  pickerValues,
} from "./pickerSignals.ts";
import { TimeList } from "./TimeList.tsx";

const tiny = optimized(import.meta.url);

const pickerStyles = new tiny.Styles({
  picker: css`
    --dialog-surface: var(--surface);
    --dialog-border: var(--line);
    --dialog-text: var(--ink);

    display: block;
  `,
  notice: css`
    display: block;
    margin-top: 12px;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--accent-soft);
    font-size: 0.9375rem;
    text-wrap: pretty;

    a {
      color: var(--accent-text);
      font-weight: 600;
      white-space: nowrap;
    }
  `,
  actionBar: css`
    display: flex;
    align-items: center;
    gap: 16px;
    position: sticky;
    bottom: 16px;
    margin-top: 24px;
    padding: 12px 12px 12px 18px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--surface);
    box-shadow: 0 8px 24px -12px oklch(20% 0.03 196 / 0.35);

    &[hidden] {
      display: none;
    }

    output {
      flex: 1;
      min-width: 0;
      font-weight: 600;
      line-height: 1.3;
    }
  `,
  confirm: css`
    display: block;
    max-width: 26rem;

    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 650;
      letter-spacing: -0.015em;
    }

    output {
      display: block;
      margin: 14px 0;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--accent-soft);
      color: var(--accent-text);
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--muted);
    }

    confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 20px;
    }
  `,
});

const confirmDialogId = "confirm-booking";

/**
 * The times a patient can choose from, with filters. Choosing a time reveals
 * the bar to continue, which opens a confirmation dialog that submits the
 * reservation.
 */
export async function SlotPicker(
  { slots, operators, code }: {
    slots: BookingSlot[];
    operators: string[];
    code: string;
  },
) {
  const values = pickerValues();
  const { signal, styled, signalRoot } = await tiny.imports(
    pickerStyles,
    pickerSignals.withInputs(undefined, pickerSeedValues(values)),
  );
  const { component } = await tiny.imports(DialogSignalComponent);
  const confirmation = component.instance();

  return (
    <signalRoot.self>
      <slot-picker
        class={styled.picker}
      >
        <FilterPanel
          operators={operators}
          values={values}
          timeCount={slots.length}
        />

        <form
          method="post"
          action="/api/reserve"
          data-nav-redirect="true"
        >
          <input type="hidden" name="code" value={code} />
          <TimeList slots={slots} />

          <action-bar class={styled.actionBar} hidden={signal.nothingChosen}>
            <output>{signal.chosen}</output>
            <Button
              type="button"
              commandfor={confirmDialogId}
              command="show-modal"
            >
              Continue
            </Button>
          </action-bar>

          <confirmation.Panel
            id={confirmDialogId}
            label="Confirm your appointment"
          >
            <confirm-body class={styled.confirm}>
              <h2>Confirm your appointment</h2>
              <output>{signal.chosen}</output>
              <p>
                Check-up and clean. We'll hold this time for you and our team
                will be in touch to confirm the details.
              </p>
              <confirm-actions>
                <Button
                  type="button"
                  variant="quiet"
                  commandfor={confirmDialogId}
                  command="close"
                >
                  Back
                </Button>
                <Button type="submit">Book this time</Button>
              </confirm-actions>
            </confirm-body>
          </confirmation.Panel>
        </form>

        <NotifyPanel code={code} values={values} />

        <booking-notice class={styled.notice}>
          This list may not show all of our available appointments. If nothing
          here suits you, please call{" "}
          <a href="tel:0892462255">(08) 9246 2255</a>, text{" "}
          <a href="sms:0415154971">0415 154 971</a> or email{" "}
          <a href="mailto:reception@sorrento.dental">
            reception@sorrento.dental
          </a>.
        </booking-notice>
      </slot-picker>
    </signalRoot.self>
  );
}
