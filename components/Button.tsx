import { css, type JSX, optimized } from "tinytools";

const tiny = optimized(import.meta.url);

const buttonStyles = new tiny.Styles({
  button: css`
    display: inline-block;
    padding: 11px 20px;
    border: 1px solid var(--ink);
    border-radius: 10px;
    background: var(--ink);
    color: var(--bg);
    font: inherit;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: opacity 120ms;

    &[hidden] {
      display: none;
    }

    &:hover {
      opacity: 0.85;
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    &[data-variant="quiet"] {
      border-color: var(--line);
      background: transparent;
      color: var(--ink);
    }
  `,
});

type Variant = "primary" | "quiet";

export async function Button(
  { variant = "primary", ...props }:
    & JSX.IntrinsicElements["button"]
    & { variant?: Variant },
) {
  const { styled } = await tiny.imports(buttonStyles);
  return <button class={styled.button} data-variant={variant} {...props} />;
}

/** A link that looks like a button. */
export async function ButtonLink(
  props: { href: string; children?: unknown },
) {
  const { styled } = await tiny.imports(buttonStyles);
  return (
    <a class={styled.button} data-variant="primary" href={props.href}>
      {props.children}
    </a>
  );
}
