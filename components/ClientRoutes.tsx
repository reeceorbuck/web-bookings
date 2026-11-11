import { css, optimized, setCustomScope } from "tinytools";
import { ClientRoutes, PartialReplace } from "tinytools/components";
import { bookingFlowId } from "./BookingView.tsx";

const tiny = optimized(import.meta.url);

const pendingStyles = new tiny.Styles({
  pending: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding-top: 72px;
    color: var(--muted);

    &::before {
      content: "";
      width: 28px;
      height: 28px;
      border: 2px solid var(--line);
      border-top-color: var(--ink);
      border-radius: 50%;
      animation: booking-spin 700ms linear infinite;
    }
  `,
  motion: setCustomScope.direct(css`
    @keyframes booking-spin {
      to {
        rotate: 360deg;
      }
    }
  `),
});

export async function BookingClientRoutes() {
  const { styled } = await tiny.imports(pendingStyles);
  const pendingClass = styled.mergeClasses(styled.pending, styled.motion);
  return (
    <ClientRoutes>
      <client-route method="get" path="/{:code}?">
        <PartialReplace id={bookingFlowId}>
          <pending-card class={pendingClass}>
            Finding available times…
          </pending-card>
        </PartialReplace>
      </client-route>
      <client-route method="post" path="/api/notify">
        <PartialReplace id={bookingFlowId}>
          <pending-card class={pendingClass}>
            Saving your request…
          </pending-card>
        </PartialReplace>
      </client-route>
      <client-route method="post" path="/api/reserve">
        <PartialReplace id={bookingFlowId}>
          <pending-card class={pendingClass}>
            Reserving your appointment…
          </pending-card>
        </PartialReplace>
      </client-route>
    </ClientRoutes>
  );
}
