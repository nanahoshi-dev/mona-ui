/**
 * What says a row is selected besides its tint, which is faint in every theme and gone in forced colors. The row
 * has to be positioned.
 */
export const themeSelectionBarClasses = `
    before:absolute before:inset-y-0 before:start-0 before:w-0.5 before:bg-(--color-selected-border)
    before:forced-color-adjust-none forced-colors:before:bg-[Highlight]
`;

/** A border in the text's color, for a selected control whose fill doesn't say it alone. */
export const themeSelectionBorderClasses = `
    relative
    after:pointer-events-none after:absolute after:inset-0
    after:rounded-[inherit] after:border-2 after:border-current
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
