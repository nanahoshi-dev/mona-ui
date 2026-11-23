/**
 * What every ripple layer shares. A layer is hidden in forced colors, where it would paint as a solid block, and in
 * the copies a drag makes of an element, its preview and its placeholder, where a wave would show at full size,
 * without its animation.
 */
const rippleLayerClasses = [
    "pointer-events-none absolute -z-1",
    "opacity-(--mona-ripple-opacity,12%)",
    "forced-colors:hidden in-[.cdk-drag-placeholder]:hidden in-[.cdk-drag-preview]:hidden"
].join(" ");

/**
 * The layer the waves are drawn in. It covers the host's padding box under its content and over its background,
 * which takes the host being a stacking context.
 */
export const rippleContainerClasses = `${rippleLayerClasses} inset-0 overflow-hidden rounded-[inherit]`;

/**
 * The layer a halo is drawn in: a point at the centre of the control it is drawn around, which the halo spreads from
 * and reaches past the control's edges. It is under the control, and in the theme's text color, since the control's
 * own can be the color of its checked fill.
 */
export const rippleHaloContainerClasses = `${rippleLayerClasses} start-1/2 top-1/2 text-foreground`;

/** A wave, in the layer's text color. The directive sizes it and moves it under the pointer. */
export const rippleWaveClasses = "absolute top-0 start-0 rounded-full bg-current";
