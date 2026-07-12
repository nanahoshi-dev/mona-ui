import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import { buttonVariants as monaButtonVariants } from "./button.mona.styles";
import { reinaButtonVariants } from "./button.reina.styles";
import { createButtonVariants } from "./button.style-composition";
import type { ButtonStyleOverrides, ButtonStyleStrategy, ButtonVariantsFunction } from "./button.types";

const defaultButtonStrategy = createInheritedThemeStrategy<ButtonVariantsFunction>(monaButtonVariants, {
    reina: reinaButtonVariants
});

export const buttonThemeVariants = (theme: ThemeStyle): ButtonVariantsFunction => defaultButtonStrategy.resolve(theme);

export function createButtonStyleStrategy(overrides: readonly ButtonStyleOverrides[] = []): ButtonStyleStrategy {
    const mona = createButtonVariants(monaButtonVariants, overrides, "mona");
    const reina = createButtonVariants(reinaButtonVariants, overrides, "reina");
    return createInheritedThemeStrategy<ButtonVariantsFunction>(mona, { reina: reina });
}
