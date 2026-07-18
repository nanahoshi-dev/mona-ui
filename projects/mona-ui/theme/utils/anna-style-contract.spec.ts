import { autoCompleteBaseVariants as annaAutoCompleteBaseVariants } from "../../auto-complete/styles/auto-complete.anna.styles";
import { autoCompleteBaseVariants as monaAutoCompleteBaseVariants } from "../../auto-complete/styles/auto-complete.mona.styles";
import { buttonVariants } from "../../button/styles/button.anna.styles";
import { buttonVariants as monaButtonVariants } from "../../button/styles/button.mona.styles";
import { calendarMonthViewDayVariants } from "../../calendar/styles/calendar.anna.styles";
import { checkmarkVariants } from "../../check-box/styles/checkbox.anna.styles";
import { colorGradientPreviewVariants as annaColorGradientPreviewVariants } from "../../color-gradient/styles/color-gradient.anna.styles";
import { colorGradientPreviewVariants as monaColorGradientPreviewVariants } from "../../color-gradient/styles/color-gradient.mona.styles";
import { colorPickerBaseVariants as annaColorPickerBaseVariants } from "../../color-picker/styles/color-picker.anna.styles";
import { colorPickerBaseVariants as monaColorPickerBaseVariants } from "../../color-picker/styles/color-picker.mona.styles";
import { comboBoxBaseVariants as annaComboBoxBaseVariants } from "../../combo-box/styles/combo-box.anna.styles";
import { comboBoxBaseVariants as monaComboBoxBaseVariants } from "../../combo-box/styles/combo-box.mona.styles";
import { datePickerBaseVariants as annaDatePickerBaseVariants } from "../../date-picker/styles/date-picker.anna.styles";
import { datePickerBaseVariants as monaDatePickerBaseVariants } from "../../date-picker/styles/date-picker.mona.styles";
import { dateTimePickerBaseVariants as annaDateTimePickerBaseVariants } from "../../datetime-picker/styles/datetime-picker.anna.styles";
import { dateTimePickerBaseVariants as monaDateTimePickerBaseVariants } from "../../datetime-picker/styles/datetime-picker.mona.styles";
import { dialogBaseVariants } from "../../dialog/styles/dialog.anna.styles";
import { dropdownListInputVariants as annaDropdownListInputVariants } from "../../dropdown-list/styles/dropdown-list.anna.styles";
import { dropdownListInputVariants as monaDropdownListInputVariants } from "../../dropdown-list/styles/dropdown-list.mona.styles";
import { dropdownPopupVariants } from "../../dropdowns/styles/dropdown-popup.anna.styles";
import { gridListTableRowVariants } from "../../grid/styles/grid.anna.styles";
import { gridListTableRowVariants as monaGridListTableRowVariants } from "../../grid/styles/grid.mona.styles";
import { listItemContentVariants } from "../../internal/list/styles/list.anna.styles";
import { listItemContentVariants as monaListItemContentVariants } from "../../internal/list/styles/list.mona.styles";
import { treeDropHintBaseVariants as annaTreeDropHintBaseVariants } from "../../internal/tree/styles/tree.anna.styles";
import { treeDropHintBaseVariants as monaTreeDropHintBaseVariants } from "../../internal/tree/styles/tree.mona.styles";
import { menubarBaseVariants as annaMenubarBaseVariants } from "../../menubar/styles/menu.anna.styles";
import { menubarBaseVariants as monaMenubarBaseVariants } from "../../menubar/styles/menu.mona.styles";
import {
    multiSelectBaseVariants as annaMultiSelectBaseVariants,
    multiSelectIndicatorContainerVariants as annaMultiSelectIndicatorContainerVariants
} from "../../multi-select/styles/multi-select.anna.styles";
import {
    multiSelectBaseVariants as monaMultiSelectBaseVariants,
    multiSelectIndicatorContainerVariants as monaMultiSelectIndicatorContainerVariants
} from "../../multi-select/styles/multi-select.mona.styles";
import {
    numericTextboxButtonVariants as annaNumericTextboxButtonVariants,
    numericTextboxVariants as annaNumericTextboxVariants
} from "../../numeric-text-box/styles/numeric-textbox.anna.styles";
import {
    numericTextboxButtonVariants as monaNumericTextboxButtonVariants,
    numericTextboxVariants as monaNumericTextboxVariants
} from "../../numeric-text-box/styles/numeric-textbox.mona.styles";
import { sliderSelectionVariants } from "../../slider/styles/slider.anna.styles";
import { stepperStepIndicatorVariants as annaStepperStepIndicatorVariants } from "../../stepper/styles/stepper.anna.styles";
import { stepperStepIndicatorVariants as monaStepperStepIndicatorVariants } from "../../stepper/styles/stepper.mona.styles";
import { switchVariants as annaSwitchVariants } from "../../switch/styles/switch.anna.styles";
import { switchVariants as monaSwitchVariants } from "../../switch/styles/switch.mona.styles";
import { tabListBaseVariants as annaTabListBaseVariants } from "../../tabs/styles/tabs.anna.styles";
import { tabListBaseVariants as monaTabListBaseVariants } from "../../tabs/styles/tabs.mona.styles";
import { textBoxVariants } from "../../text-box/styles/textbox.anna.styles";
import { textBoxVariants as monaTextBoxVariants } from "../../text-box/styles/textbox.mona.styles";
import { timePickerBaseVariants as annaTimePickerBaseVariants } from "../../time-picker/styles/time-picker.anna.styles";
import { timePickerBaseVariants as monaTimePickerBaseVariants } from "../../time-picker/styles/time-picker.mona.styles";
import { timeSelectorListItemVariants as annaTimeSelectorListItemVariants } from "../../time-selector/styles/time-selector.anna.styles";
import { timeSelectorListItemVariants as monaTimeSelectorListItemVariants } from "../../time-selector/styles/time-selector.mona.styles";

const geometryClassPattern =
    /(?:^|:)(?:-?(?:h|w|min-h|min-w|max-h|max-w|p[trblesxy]?|m[trblesxy]?|gap(?:-[xy])?|space-[xy]|basis|top|right|bottom|left|inset(?:-[xy])?|translate-[xy]|grid-cols|grid-rows)-(?:\d+(?:\.\d+)?|px|full|auto|fit|min|max|screen|\[)|text-(?:xs|sm|base|md|lg|xl|\d+xl))/;

function geometryClasses(classes: string): string[] {
    return classes
        .split(/\s+/)
        .filter(className => geometryClassPattern.test(className))
        .sort();
}

function expectGeometryParity(annaClasses: string, monaClasses: string): void {
    expect(geometryClasses(annaClasses)).toEqual(geometryClasses(monaClasses));
}

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

    it("matches Mona geometry for every themed size recipe", () => {
        const sizes = ["small", "medium", "large"] as const;

        for (const size of sizes) {
            expectGeometryParity(buttonVariants({ size }), monaButtonVariants({ size }));
            expectGeometryParity(textBoxVariants({ size }), monaTextBoxVariants({ size }));
            expectGeometryParity(annaAutoCompleteBaseVariants({ size }), monaAutoCompleteBaseVariants({ size }));
            expectGeometryParity(annaColorPickerBaseVariants({ size }), monaColorPickerBaseVariants({ size }));
            expectGeometryParity(annaComboBoxBaseVariants({ size }), monaComboBoxBaseVariants({ size }));
            expectGeometryParity(annaDatePickerBaseVariants({ size }), monaDatePickerBaseVariants({ size }));
            expectGeometryParity(annaDateTimePickerBaseVariants({ size }), monaDateTimePickerBaseVariants({ size }));
            expectGeometryParity(annaDropdownListInputVariants({ size }), monaDropdownListInputVariants({ size }));
            expectGeometryParity(annaMultiSelectBaseVariants({ size }), monaMultiSelectBaseVariants({ size }));
            expectGeometryParity(
                annaMultiSelectIndicatorContainerVariants({ size }),
                monaMultiSelectIndicatorContainerVariants({ size })
            );
            expectGeometryParity(annaNumericTextboxVariants({ size }), monaNumericTextboxVariants({ size }));
            expectGeometryParity(
                annaNumericTextboxButtonVariants({ size }),
                monaNumericTextboxButtonVariants({ size })
            );
            expectGeometryParity(annaSwitchVariants({ size }), monaSwitchVariants({ size }));
            expectGeometryParity(annaTabListBaseVariants({ size }), monaTabListBaseVariants({ size }));
            expectGeometryParity(annaTimePickerBaseVariants({ size }), monaTimePickerBaseVariants({ size }));
            expectGeometryParity(
                annaTimeSelectorListItemVariants({ size }),
                monaTimeSelectorListItemVariants({ size })
            );
        }

        for (const size of ["small", "medium"] as const) {
            expectGeometryParity(annaMenubarBaseVariants({ size }), monaMenubarBaseVariants({ size }));
        }

        expectGeometryParity(annaColorGradientPreviewVariants(), monaColorGradientPreviewVariants());
        expectGeometryParity(
            gridListTableRowVariants({ selected: true }),
            monaGridListTableRowVariants({ selected: true })
        );
        expectGeometryParity(listItemContentVariants(), monaListItemContentVariants());
        expectGeometryParity(annaTreeDropHintBaseVariants(), monaTreeDropHintBaseVariants());
        expectGeometryParity(annaStepperStepIndicatorVariants(), monaStepperStepIndicatorVariants());
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

    it("uses semantic elevation while keeping ordinary controls flat", () => {
        expect(dropdownPopupVariants()).toContain("shadow-(--shadow-overlay)");
        expect(dialogBaseVariants()).toContain("shadow-(--shadow-overlay)");
        expect(buttonVariants()).not.toContain("shadow-(--shadow-control)");
    });
});
