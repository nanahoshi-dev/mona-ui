import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import { timePickerBaseVariants as monaTimePickerBaseVariants } from "./time-picker.mona.styles";
import { reinaTimePickerBaseVariants } from "./time-picker.reina.styles";
import { createTimePickerBaseVariants } from "./time-picker.style-composition";
import type {
    TimePickerBaseVariantsFunction,
    TimePickerStyleOverrides,
    TimePickerStyleStrategy,
    TimePickerVariantsFunctions
} from "./time-picker.types";

const defaultTimePickerBaseStrategy = createInheritedThemeStrategy<TimePickerBaseVariantsFunction>(
    monaTimePickerBaseVariants,
    { reina: reinaTimePickerBaseVariants }
);

export const timePickerBaseThemeVariants = (theme: ThemeStyle): TimePickerBaseVariantsFunction =>
    defaultTimePickerBaseStrategy.resolve(theme);

export function createTimePickerStyleStrategy(
    overrides: readonly TimePickerStyleOverrides[] = []
): TimePickerStyleStrategy {
    const mona: TimePickerVariantsFunctions = {
        base: createTimePickerBaseVariants(monaTimePickerBaseVariants, overrides, "mona")
    };
    const reina: TimePickerVariantsFunctions = {
        base: createTimePickerBaseVariants(reinaTimePickerBaseVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<TimePickerVariantsFunctions>(mona, { reina: reina });
}
