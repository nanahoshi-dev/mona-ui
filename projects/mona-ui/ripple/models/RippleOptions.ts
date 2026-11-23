/**
 * @description Ripple settings. Set them for the application with `provideRipple()`.
 */
export interface RippleOptions {
    /**
     * @description Whether pressing a button, or another element with the `monaRipple` directive, draws a ripple.
     * Ripples are off until `provideRipple()` turns them on.
     */
    readonly enabled: boolean;
}
