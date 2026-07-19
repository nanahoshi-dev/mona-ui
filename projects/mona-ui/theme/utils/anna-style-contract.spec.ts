import { buttonThemeVariants } from "../../button/styles/button.styles";
import { calendarBaseThemeVariants } from "../../calendar/styles/calendar.styles";
import { listItemContentThemeVariants, listThemeVariants } from "../../internal/list/styles/list.styles";
import { menubarBaseThemeVariants } from "../../menubar/styles/menu.styles";
import { sliderHandleThemeVariants, sliderSelectionThemeVariants } from "../../slider/styles/slider.styles";
import { tabContentThemeVariants } from "../../tabs/styles/tabs.styles";
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
        expect(calendarBaseThemeVariants()).toContain("shadow-(--mona-calendar-shadow)");
        expect(menubarBaseThemeVariants()).toContain("shadow-(--mona-menubar-shadow)");
        expect(listThemeVariants()).toContain("bg-(--mona-list-background)");
        expect(sliderSelectionThemeVariants()).toContain("duration-(--mona-motion-fast)");
        expect(sliderHandleThemeVariants()).toContain("border-(--mona-slider-handle-border-color)");
        expect(tabContentThemeVariants()).toContain("bg-(--mona-tab-content-background)");
        expect(timeSelectorListThemeVariants()).toContain("focus-visible:bg-(--color-focus-surface)");
    });

    it("preserves Mona's raised surfaces and Anna's flat controls", () => {
        expect(monaTheme.variants.dark.shadows["--shadow-control"]).not.toBe("none");
        expect(monaTheme.variants.dark.components["--mona-calendar-shadow"]).toBe("var(--shadow-raised)");
        expect(annaTheme.variants.dark.shadows["--shadow-control"]).toBe("none");
        expect(annaTheme.variants.dark.components["--mona-calendar-shadow"]).toBe("none");
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
