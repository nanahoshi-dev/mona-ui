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
