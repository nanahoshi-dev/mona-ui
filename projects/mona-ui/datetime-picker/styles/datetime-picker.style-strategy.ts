import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    dateTimePickerBaseVariants as monaDateTimePickerBaseVariants,
    dateTimePickerFooterVariants as monaDateTimePickerFooterVariants,
    dateTimePickerHeaderVariants as monaDateTimePickerHeaderVariants
} from "./datetime-picker.mona.styles";
import {
    reinaDateTimePickerBaseVariants,
    reinaDateTimePickerFooterVariants,
    reinaDateTimePickerHeaderVariants
} from "./datetime-picker.reina.styles";
import {
    createDateTimePickerBaseVariants,
    createDateTimePickerFooterVariants,
    createDateTimePickerHeaderVariants
} from "./datetime-picker.style-composition";
import type {
    DateTimePickerBaseVariantsFunction,
    DateTimePickerFooterVariantsFunction,
    DateTimePickerHeaderVariantsFunction,
    DateTimePickerStyleOverrides,
    DateTimePickerStyleStrategy,
    DateTimePickerVariantsFunctions
} from "./datetime-picker.types";

const defaultDateTimePickerBaseStrategy = createInheritedThemeStrategy<DateTimePickerBaseVariantsFunction>(
    monaDateTimePickerBaseVariants,
    { reina: reinaDateTimePickerBaseVariants }
);
const defaultDateTimePickerHeaderStrategy = createInheritedThemeStrategy<DateTimePickerHeaderVariantsFunction>(
    monaDateTimePickerHeaderVariants,
    { reina: reinaDateTimePickerHeaderVariants }
);
const defaultDateTimePickerFooterStrategy = createInheritedThemeStrategy<DateTimePickerFooterVariantsFunction>(
    monaDateTimePickerFooterVariants,
    { reina: reinaDateTimePickerFooterVariants }
);

export const dateTimePickerBaseThemeVariants = (theme: ThemeStyle): DateTimePickerBaseVariantsFunction =>
    defaultDateTimePickerBaseStrategy.resolve(theme);
export const dateTimePickerHeaderThemeVariants = (theme: ThemeStyle): DateTimePickerHeaderVariantsFunction =>
    defaultDateTimePickerHeaderStrategy.resolve(theme);
export const dateTimePickerFooterThemeVariants = (theme: ThemeStyle): DateTimePickerFooterVariantsFunction =>
    defaultDateTimePickerFooterStrategy.resolve(theme);

export function createDateTimePickerStyleStrategy(
    overrides: readonly DateTimePickerStyleOverrides[] = []
): DateTimePickerStyleStrategy {
    const mona: DateTimePickerVariantsFunctions = {
        base: createDateTimePickerBaseVariants(monaDateTimePickerBaseVariants, overrides, "mona"),
        footer: createDateTimePickerFooterVariants(monaDateTimePickerFooterVariants, overrides, "mona"),
        header: createDateTimePickerHeaderVariants(monaDateTimePickerHeaderVariants, overrides, "mona")
    };
    const reina: DateTimePickerVariantsFunctions = {
        base: createDateTimePickerBaseVariants(reinaDateTimePickerBaseVariants, overrides, "reina"),
        footer: createDateTimePickerFooterVariants(reinaDateTimePickerFooterVariants, overrides, "reina"),
        header: createDateTimePickerHeaderVariants(reinaDateTimePickerHeaderVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<DateTimePickerVariantsFunctions>(mona, { reina: reina });
}
