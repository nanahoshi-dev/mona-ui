/**
 * What says a row is selected besides its tint, which is faint in every theme and gone in forced colors. The row
 * has to be positioned.
 */
export const themeSelectionBarClasses = `
    before:absolute before:inset-y-0 before:start-0 before:w-0.5 before:bg-(--color-selected-border)
    before:forced-color-adjust-none forced-colors:before:bg-[Highlight]
`;

/**
 * A border in the text's color for a selected control, drawn only when the user asks for more contrast or forced colors
 * are on. Elsewhere the fill says it alone. A control with a border of its own adds `after:-inset-px`, so this one
 * replaces it.
 */
export const themeSelectionBorderClasses = `
    relative
    after:pointer-events-none after:absolute after:inset-0
    after:rounded-[inherit] after:border-current
    contrast-more:after:border-2 forced-colors:after:border-2
`;

export const themeControlBackdropClasses = `
    [background-image:var(--mona-effect-control-background-image,none)]
    [backdrop-filter:var(--mona-effect-control-backdrop-filter,none)]
    [-webkit-backdrop-filter:var(--mona-effect-control-backdrop-filter,none)]
`;

export const themeControlSurfaceClasses = `
    [background-color:var(--mona-effect-control-background-color,var(--color-input-background))]
    ${themeControlBackdropClasses}
`;

export const themeRaisedBackdropClasses = `
    [background-image:var(--mona-effect-raised-background-image,none)]
    [backdrop-filter:var(--mona-effect-raised-backdrop-filter,none)]
    [-webkit-backdrop-filter:var(--mona-effect-raised-backdrop-filter,none)]
`;

export const themeRaisedSurfaceClasses = `
    [background-color:var(--mona-effect-raised-background-color,var(--color-surface-raised))]
    ${themeRaisedBackdropClasses}
`;

export const themeOverlayBackdropClasses = `
    [background-image:var(--mona-effect-overlay-background-image,none)]
    [backdrop-filter:var(--mona-effect-overlay-backdrop-filter,none)]
    [-webkit-backdrop-filter:var(--mona-effect-overlay-backdrop-filter,none)]
`;

export const themeOverlaySurfaceClasses = `
    [background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]
    ${themeOverlayBackdropClasses}
`;

/**
 * Blurs what's behind a modal's backdrop or a spinner's overlay, as much as the theme's backdrop asks. The fallback is
 * Mona's, for a page without a theme provider.
 */
export const themeBackdropFilterClasses = `
    [backdrop-filter:var(--mona-effect-backdrop-backdrop-filter,blur(4px))]
    [-webkit-backdrop-filter:var(--mona-effect-backdrop-backdrop-filter,blur(4px))]
`;

/**
 * The backdrop behind a modal dialog, window or sheet, which dims the page and blurs it if the theme does. As a list,
 * for a popup's `backdropClass`, which takes one class per entry.
 */
export const themeBackdropClassList: readonly string[] = [
    "[background-color:var(--mona-effect-backdrop-background-color,color-mix(in_oklab,var(--color-background)_50%,transparent))]",
    "[background-image:var(--mona-effect-backdrop-background-image,none)]",
    ...themeBackdropFilterClasses.trim().split(/\s+/)
];
