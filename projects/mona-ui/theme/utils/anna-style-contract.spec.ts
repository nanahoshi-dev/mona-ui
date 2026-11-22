import { buttonThemeVariants } from "../../button/styles/button.styles";
import { calendarBaseThemeVariants } from "../../calendar/styles/calendar.styles";
import { datePopupThemeVariants } from "../../date-input/styles/date-popup.styles";
import { gridBaseThemeVariants } from "../../grid/styles/grid.styles";
import { listItemContentThemeVariants } from "../../internal/list/styles/list.styles";
import { menubarBaseThemeVariants } from "../../menubar/styles/menu.styles";
import { sliderHandleThemeVariants, sliderSelectionThemeVariants } from "../../slider/styles/slider.styles";
import { checkmarkThemeVariants } from "../../check-box/styles/checkbox.styles";
import { textBoxThemeVariants } from "../../text-box/styles/textbox.styles";
import { timeSelectorListThemeVariants } from "../../time-selector/styles/time-selector.styles";
import { annaTheme } from "../definitions/anna-theme";
import { monaTheme } from "../definitions/mona-theme";

describe("canonical recipe and built-in profile contract", () => {
    it("routes selected interaction states through semantic variables", () => {
        const selectedButton = buttonThemeVariants({ look: "default", selected: true });
        const selectedListItem = listItemContentThemeVariants({ checkboxes: false, selected: true });

        expect(selectedButton).toContain("bg-(--color-selected)");
        expect(selectedButton).toContain("hover:bg-(--color-selected-hover)");
        expect(selectedButton).toContain("active:bg-(--color-selected-active)");
        expect(selectedListItem).toContain("bg-(--color-selected)");
        expect(selectedListItem).toContain("focus:bg-(--color-selected-focus)");
    });

    it("routes every former structural recipe difference through profile variables", () => {
        expect(buttonThemeVariants({ look: "default" })).toContain(
            "[backdrop-filter:var(--mona-effect-control-backdrop-filter,none)]"
        );
        expect(calendarBaseThemeVariants()).toContain("shadow-(--mona-calendar-shadow)");
        expect(calendarBaseThemeVariants()).toContain(
            "[backdrop-filter:var(--mona-effect-raised-backdrop-filter,none)]"
        );
        expect(menubarBaseThemeVariants()).toContain("shadow-(--mona-menubar-shadow)");
        expect(datePopupThemeVariants()).toContain("[backdrop-filter:var(--mona-effect-overlay-backdrop-filter,none)]");
        expect(sliderSelectionThemeVariants()).toContain("duration-(--mona-motion-fast)");
        expect(sliderHandleThemeVariants()).toContain("border-(--mona-slider-handle-border-color)");
        expect(timeSelectorListThemeVariants()).toContain("focus-visible:bg-(--color-focus-surface)");
        expect(gridBaseThemeVariants()).not.toContain("backdrop-filter");
    });

    it("routes the focus and invalid rings through the focus ring variables", () => {
        const width = "ring-(length:--mona-focus-ring-width,2px)";
        const textBox = textBoxThemeVariants();
        const checkmark = checkmarkThemeVariants();

        expect(textBox).toContain(`focus-within:${width}`);
        expect(textBox).toContain("focus-within:ring-focus-indicator/(--mona-focus-ring-opacity,35%)");
        expect(textBox).toContain(`data-[invalid='true']:${width}`);
        expect(textBox).toContain("data-[invalid='true']:ring-error/(--mona-focus-ring-opacity,35%)");
        expect(checkmark).toContain(`peer-focus-visible:${width}`);
        expect(checkmark).toContain("peer-focus-visible:ring-focus-indicator/(--mona-focus-ring-opacity,35%)");
    });

    it("preserves Mona's raised surfaces and Anna's flat controls", () => {
        expect(monaTheme.variants.dark.shadows["--shadow-control"]).not.toBe("0 0 #0000");
        expect(monaTheme.variants.dark.components["--mona-calendar-shadow"]).toBe("var(--shadow-raised)");
        expect(annaTheme.variants.dark.shadows["--shadow-control"]).toBe("0 0 #0000");
        expect(annaTheme.variants.dark.components["--mona-calendar-shadow"]).toBe("0 0 #0000");
    });

    it("preserves the distinct selected and focus-surface behaviors", () => {
        expect(monaTheme.variants.dark.colors["--color-selected"]).toBe("var(--color-active)");
        expect(monaTheme.variants.dark.colors["--color-focus-surface"]).toBe("var(--color-surface-muted)");
        expect(annaTheme.variants.dark.colors["--color-selected"]).toBe("var(--color-primary)");
        expect(annaTheme.variants.dark.colors["--color-focus-surface"]).toBe("var(--color-surface)");
    });

    it("keeps the theme-specific timing values in profiles rather than recipes", () => {
        expect(monaTheme.variants.dark.motion).toEqual({
            "--mona-motion-fast": "200ms",
            "--mona-motion-standard": "300ms"
        });
        expect(annaTheme.variants.dark.motion).toEqual({
            "--mona-motion-fast": "150ms",
            "--mona-motion-standard": "150ms"
        });
    });
});
