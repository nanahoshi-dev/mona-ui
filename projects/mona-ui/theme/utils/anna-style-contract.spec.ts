import { buttonVariants } from "../../button/styles/button.anna.styles";
import { calendarMonthViewDayVariants } from "../../calendar/styles/calendar.anna.styles";
import { checkmarkVariants } from "../../check-box/styles/checkbox.anna.styles";
import { dialogBaseVariants } from "../../dialog/styles/dialog.anna.styles";
import { dropdownPopupVariants } from "../../dropdowns/styles/dropdown-popup.anna.styles";
import { gridListTableRowVariants } from "../../grid/styles/grid.anna.styles";
import { listItemContentVariants } from "../../internal/list/styles/list.anna.styles";
import { sliderSelectionVariants } from "../../slider/styles/slider.anna.styles";
import { textBoxVariants } from "../../text-box/styles/textbox.anna.styles";

describe("Anna style contract", () => {
    it("preserves every public button look, size, and rounded value", () => {
        const looks = [
            "default",
            "primary",
            "success",
            "error",
            "warning",
            "info",
            "outline",
            "secondary",
            "ghost",
            "link",
            "clear"
        ] as const;
        const sizes = ["small", "medium", "large"] as const;
        const roundedValues = {
            none: "rounded-none",
            small: "rounded-sm",
            medium: "rounded-md",
            large: "rounded-lg",
            full: "rounded-full"
        } as const;

        for (const look of looks) {
            for (const size of sizes) {
                for (const [rounded, roundedClass] of Object.entries(roundedValues)) {
                    const classes = buttonVariants({
                        disabled: false,
                        loading: false,
                        look,
                        rounded: rounded as keyof typeof roundedValues,
                        selected: true,
                        size
                    });
                    expect(classes).toContain("inline-flex");
                    expect(classes).toContain(roundedClass);
                }
            }
        }
    });

    it("uses the compact 26, 30, and 34 pixel control scale", () => {
        expect(buttonVariants({ size: "small" })).toContain("h-6.5");
        expect(buttonVariants({ size: "medium" })).toContain("h-7.5");
        expect(buttonVariants({ size: "large" })).toContain("h-8.5");
        expect(textBoxVariants({ size: "small" })).toContain("h-6.5");
        expect(textBoxVariants({ size: "medium" })).toContain("h-7.5");
        expect(textBoxVariants({ size: "large" })).toContain("h-8.5");
    });

    it("keeps invalid focus treatments stronger than ordinary focus treatments", () => {
        expect(textBoxVariants()).toContain("focus-within:ring-focus-indicator/35");
        expect(textBoxVariants()).toContain("data-[invalid='true']:focus-within:ring-error/35");
        expect(checkmarkVariants()).toContain("peer-focus-visible:ring-focus-indicator/35");
        expect(checkmarkVariants()).toContain("data-[invalid='true']:peer-focus-visible:ring-error/35");
    });

    it("uses violet bands for selected list, grid, and calendar states", () => {
        expect(listItemContentVariants({ checkboxes: false, selected: true })).toContain("bg-primary");
        expect(gridListTableRowVariants({ selected: true })).toContain("bg-primary");
        expect(calendarMonthViewDayVariants({ selected: true })).toContain("bg-primary");
        expect(sliderSelectionVariants()).toContain("bg-primary");
    });

    it("limits elevation to crisp overlay surfaces", () => {
        expect(dropdownPopupVariants()).toContain("shadow-[0_6px_14px_-4px_rgb(0_0_0/0.65)]");
        expect(dialogBaseVariants()).toContain("shadow-[0_6px_14px_-4px_rgb(0_0_0/0.65)]");
        expect(buttonVariants()).not.toContain("shadow-xs");
    });
});
