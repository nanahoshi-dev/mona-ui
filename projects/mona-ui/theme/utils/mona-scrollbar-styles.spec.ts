import { datePopupVariants } from "../../date-input/styles/date-popup.mona.styles";
import { dialogContentVariants } from "../../dialog/styles/dialog.mona.styles";
import { dropdownPopupVariants } from "../../dropdowns/styles/dropdown-popup.mona.styles";
import { editorContainerVariants } from "../../editor/styles/editor.mona.styles";
import { gridListBaseVariants } from "../../grid/styles/grid.mona.styles";
import { listInnerListVariants } from "../../internal/list/styles/list.mona.styles";
import { tabContentVariants } from "../../tabs/styles/tabs.mona.styles";
import { timeSelectorListVariants } from "../../time-selector/styles/time-selector.mona.styles";
import { windowContentVariants } from "../../window/styles/window.mona.styles";

const scrollbarColorClass = "[scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)]";
const scrollbarWidthClass = "[scrollbar-width:thin]";

describe("Mona scrollbar styles", () => {
    it("uses Mona scrollbar colors and thin geometry on scrollable component surfaces", () => {
        const scrollableSurfaceClasses = [
            datePopupVariants(),
            dialogContentVariants(),
            dropdownPopupVariants(),
            editorContainerVariants(),
            gridListBaseVariants(),
            listInnerListVariants(),
            tabContentVariants(),
            timeSelectorListVariants(),
            windowContentVariants()
        ];

        for (const classes of scrollableSurfaceClasses) {
            expect(classes).toContain(scrollbarColorClass);
            expect(classes).toContain(scrollbarWidthClass);
        }
    });
});
