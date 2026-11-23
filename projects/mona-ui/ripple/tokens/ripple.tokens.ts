import { InjectionToken } from "@angular/core";
import type { RippleOptions } from "../models/RippleOptions";

/** The settings used when nothing is provided with `provideRipple()`: no ripples. */
export const DEFAULT_RIPPLE_OPTIONS: RippleOptions = {
    enabled: false
};

/**
 * @description Ripple settings. Set them for the application with `provideRipple()`, or provide this token on a
 * component to turn ripples on or off for everything inside it.
 */
export const RIPPLE_OPTIONS = new InjectionToken<RippleOptions>("Mona UI ripple options", {
    providedIn: "root",
    factory: () => DEFAULT_RIPPLE_OPTIONS
});
