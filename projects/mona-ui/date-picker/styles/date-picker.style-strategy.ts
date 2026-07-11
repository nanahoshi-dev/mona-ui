import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { datePickerBaseVariants as monaDatePickerBaseVariants } from "./date-picker.mona.styles";
import { reinaDatePickerBaseVariants } from "./date-picker.reina.styles";
import { createDatePickerBaseVariants } from "./date-picker.style-composition";
import type {
    DatePickerBaseVariantsFunction,
    DatePickerStyleOverrides,
    DatePickerStyleStrategy,
    DatePickerVariantsFunctions
} from "./date-picker.types";

const defaultDatePickerBaseStrategy = createThemeStrategy<DatePickerBaseVariantsFunction>(
    { mona: monaDatePickerBaseVariants, reina: reinaDatePickerBaseVariants },
    monaDatePickerBaseVariants
);

export const datePickerBaseThemeVariants = (theme: ThemeStyle): DatePickerBaseVariantsFunction =>
    defaultDatePickerBaseStrategy.resolve(theme);

export function createDatePickerStyleStrategy(
    overrides: readonly DatePickerStyleOverrides[] = []
): DatePickerStyleStrategy {
    const mona: DatePickerVariantsFunctions = {
        base: createDatePickerBaseVariants(monaDatePickerBaseVariants, overrides, "mona")
    };
    const reina: DatePickerVariantsFunctions = {
        base: createDatePickerBaseVariants(reinaDatePickerBaseVariants, overrides, "reina")
    };
    return createThemeStrategy<DatePickerVariantsFunctions>({ mona, reina }, mona);
}
