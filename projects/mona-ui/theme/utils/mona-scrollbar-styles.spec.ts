import { datePopupThemeVariants } from "../../date-input/styles/date-popup.styles";
import { dialogContentThemeVariants } from "../../dialog/styles/dialog.styles";
import { dropdownPopupThemeVariants } from "../../dropdowns/styles/dropdown-popup.styles";
import { editorContainerThemeVariants } from "../../editor/styles/editor.styles";
import { gridListBaseThemeVariants } from "../../grid/styles/grid.styles";
import { listInnerListThemeVariants } from "../../internal/list/styles/list.styles";
import { tabContentThemeVariants } from "../../tabs/styles/tabs.styles";
import { timeSelectorListThemeVariants } from "../../time-selector/styles/time-selector.styles";
import { windowContentThemeVariants } from "../../window/styles/window.styles";

const scrollbarColorClass = "[scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)]";
const scrollbarWidthClass = "[scrollbar-width:thin]";

describe("Mona scrollbar styles", () => {
    it("uses Mona scrollbar colors and thin geometry on scrollable component surfaces", () => {
        const scrollableSurfaceClasses = [
            datePopupThemeVariants(),
            dialogContentThemeVariants(),
            dropdownPopupThemeVariants(),
            editorContainerThemeVariants(),
            gridListBaseThemeVariants(),
            listInnerListThemeVariants(),
            tabContentThemeVariants(),
            timeSelectorListThemeVariants(),
            windowContentThemeVariants()
        ];

        for (const classes of scrollableSurfaceClasses) {
            expect(classes).toContain(scrollbarColorClass);
            expect(classes).toContain(scrollbarWidthClass);
        }
    });
});
