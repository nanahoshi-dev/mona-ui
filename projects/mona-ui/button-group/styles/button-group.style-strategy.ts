import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { buttonGroupVariants as monaButtonGroupVariants } from "./button-group.mona.styles";
import { createButtonGroupVariants } from "./button-group.style-composition";
import type { ButtonGroupStyleOverrides, ButtonGroupStyleStrategy, ButtonGroupVariantsFunction } from "./button-group.types";

const defaultButtonGroupStrategy = createThemeStrategy<ButtonGroupVariantsFunction>(
    { mona: monaButtonGroupVariants },
    monaButtonGroupVariants
);

export const buttonGroupThemeVariants = (theme: ThemeStyle): ButtonGroupVariantsFunction =>
    defaultButtonGroupStrategy.resolve(theme);

export function createButtonGroupStyleStrategy(
    overrides: readonly ButtonGroupStyleOverrides[] = []
): ButtonGroupStyleStrategy {
    const mona = createButtonGroupVariants(monaButtonGroupVariants, overrides, "mona");
    const reina = createButtonGroupVariants(monaButtonGroupVariants, overrides, "reina");
    return createThemeStrategy<ButtonGroupVariantsFunction>({ mona, reina }, mona);
}
