import { type EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import type { RippleOptions } from "../models/RippleOptions";
import { RIPPLE_OPTIONS } from "../tokens/ripple.tokens";

/**
 * Turns on the ripple Mona UI's buttons, and elements with the `monaRipple` directive, draw when pressed. Pass
 * `{ enabled: false }` to keep them off, for example behind a setting.
 */
export function provideRipple(options: Partial<RippleOptions> = {}): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: RIPPLE_OPTIONS, useValue: { enabled: true, ...options } }]);
}
