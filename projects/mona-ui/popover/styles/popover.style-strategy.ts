import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { tooltipArrowThemeVariants } from "@nanahoshi/mona-ui/tooltip";
import {
    popoverBaseVariants as monaPopoverBaseVariants,
    popoverContentVariants as monaPopoverContentVariants,
    popoverHeaderVariants as monaPopoverHeaderVariants
} from "./popover.mona.styles";
import {
    reinaPopoverBaseVariants,
    reinaPopoverContentVariants,
    reinaPopoverHeaderVariants
} from "./popover.reina.styles";
import {
    createPopoverBaseVariants,
    createPopoverContentVariants,
    createPopoverHeaderVariants
} from "./popover.style-composition";
import type {
    PopoverBaseVariantsFunction,
    PopoverContentVariantsFunction,
    PopoverHeaderVariantsFunction,
    PopoverStyleOverrides,
    PopoverStyleStrategy,
    PopoverVariantsFunctions
} from "./popover.types";

const defaultPopoverBaseStrategy = createThemeStrategy<PopoverBaseVariantsFunction>(
    { mona: monaPopoverBaseVariants, reina: reinaPopoverBaseVariants },
    monaPopoverBaseVariants
);
const defaultPopoverHeaderStrategy = createThemeStrategy<PopoverHeaderVariantsFunction>(
    { mona: monaPopoverHeaderVariants, reina: reinaPopoverHeaderVariants },
    monaPopoverHeaderVariants
);
const defaultPopoverContentStrategy = createThemeStrategy<PopoverContentVariantsFunction>(
    { mona: monaPopoverContentVariants, reina: reinaPopoverContentVariants },
    monaPopoverContentVariants
);

export const popoverBaseThemeVariants = (theme: ThemeStyle): PopoverBaseVariantsFunction =>
    defaultPopoverBaseStrategy.resolve(theme);

export const popoverHeaderThemeVariants = (theme: ThemeStyle): PopoverHeaderVariantsFunction =>
    defaultPopoverHeaderStrategy.resolve(theme);

export const popoverContentThemeVariants = (theme: ThemeStyle): PopoverContentVariantsFunction =>
    defaultPopoverContentStrategy.resolve(theme);

/**
 * The popover arrow reuses Tooltip's arrow recipe rather than defining its own,
 * so overriding Tooltip's arrow styling (via DI or the default strategy) also affects Popover.
 */
export const popoverArrowThemeVariants = (theme: ThemeStyle) => tooltipArrowThemeVariants(theme);

export function createPopoverStyleStrategy(overrides: readonly PopoverStyleOverrides[] = []): PopoverStyleStrategy {
    const mona: PopoverVariantsFunctions = {
        base: createPopoverBaseVariants(monaPopoverBaseVariants, overrides, "mona"),
        header: createPopoverHeaderVariants(monaPopoverHeaderVariants, overrides, "mona"),
        content: createPopoverContentVariants(monaPopoverContentVariants, overrides, "mona")
    };
    const reina: PopoverVariantsFunctions = {
        base: createPopoverBaseVariants(reinaPopoverBaseVariants, overrides, "reina"),
        header: createPopoverHeaderVariants(reinaPopoverHeaderVariants, overrides, "reina"),
        content: createPopoverContentVariants(reinaPopoverContentVariants, overrides, "reina")
    };
    return createThemeStrategy<PopoverVariantsFunctions>({ mona, reina }, mona);
}
