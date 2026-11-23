/**
 * The layer the waves are drawn in. It covers the host's padding box under its content and over its background,
 * which takes the host being a stacking context. It is hidden in forced colors, where it would paint as a solid block.
 */
export const rippleContainerClasses = [
    "pointer-events-none absolute inset-0 -z-1",
    "overflow-hidden rounded-[inherit]",
    "opacity-(--mona-ripple-opacity,12%)",
    "forced-colors:hidden"
].join(" ");

/** A wave, in the host's text color. The directive sizes it and moves it under the pointer. */
export const rippleWaveClasses = "absolute top-0 start-0 rounded-full bg-current";
