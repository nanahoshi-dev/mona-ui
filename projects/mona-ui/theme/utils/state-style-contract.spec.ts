import { twMerge } from "tailwind-merge";
import { buttonGroupThemeVariants } from "../../button-group/styles/button-group.styles";
import { buttonThemeVariants } from "../../button/styles/button.styles";
import { calendarMonthViewDayThemeVariants } from "../../calendar/styles/calendar.styles";
import { checkboxDirectiveThemeVariants, checkmarkThemeVariants } from "../../check-box/styles/checkbox.styles";
import { chipThemeVariants } from "../../chip/styles/chip.styles";
import { circularProgressBarBaseThemeVariants } from "../../circular-progress-bar/styles/circular-progress-bar.styles";
import { editorContainerThemeVariants } from "../../editor/styles/editor.styles";
import { gridListTableRowThemeVariants, gridRowReorderHandleThemeVariants } from "../../grid/styles/grid.styles";
import { listItemContentThemeVariants } from "../../internal/list/styles/list.styles";
import { treeNodeBaseThemeVariants } from "../../internal/tree/styles/tree.styles";
import { numericTextboxThemeVariants } from "../../numeric-text-box/styles/numeric-textbox.styles";
import { progressBarTrackThemeVariants } from "../../progress-bar/styles/progress-bar.styles";
import {
    radioButtonCircleThemeVariants,
    radioButtonIndicatorThemeVariants
} from "../../radio-button/styles/radio.styles";
import { segmentedContainerThemeVariants } from "../../segmented/styles/segmented.styles";
import { sliderSelectionThemeVariants, sliderTrackThemeVariants } from "../../slider/styles/slider.styles";
import { splitButtonThemeVariants } from "../../split-button/styles/split-button.styles";
import { stepperTrackLineThemeVariants } from "../../stepper/styles/stepper.styles";
import { switchHandleThemeVariants, switchThemeVariants } from "../../switch/styles/switch.styles";
import { tabListListItemThemeVariants } from "../../tabs/styles/tabs.styles";
import { inputThemeVariants, textBoxThemeVariants } from "../../text-box/styles/textbox.styles";
import { timeSelectorListItemThemeVariants } from "../../time-selector/styles/time-selector.styles";

const INDICATOR = "bg-[var(--mona-indicator-color,var(--color-primary))]";

describe("what says a row is selected", () => {
    it.each([
        ["a list item", listItemContentThemeVariants({ checkboxes: false, selected: true })],
        ["a tree node", treeNodeBaseThemeVariants({ selected: true })],
        ["a time in the selector", timeSelectorListItemThemeVariants({ selected: true })]
    ])("gives %s a bar on its start edge, which forced colors keep", (_label, classes) => {
        expect(classes).toContain("before:absolute");
        expect(classes).toContain("before:start-0");
        expect(classes).toContain("before:w-0.5");
        expect(classes).toContain("before:bg-(--color-selected-border)");
        expect(classes).toContain("before:forced-color-adjust-none");
        expect(classes).toContain("forced-colors:before:bg-[Highlight]");
    });

    it.each([
        ["a list item", listItemContentThemeVariants({ checkboxes: false, selected: false })],
        ["a tree node", treeNodeBaseThemeVariants({ selected: false })],
        ["a time in the selector", timeSelectorListItemThemeVariants({ selected: false })]
    ])("gives %s no bar when it isn't selected", (_label, classes) => {
        expect(classes).not.toContain("before:bg-(--color-selected-border)");
    });

    it("leaves a list item with a check box to its check box", () => {
        expect(listItemContentThemeVariants({ checkboxes: true, selected: true })).not.toContain(
            "before:bg-(--color-selected-border)"
        );
    });

    it("positions a tree node for its bar", () => {
        expect(treeNodeBaseThemeVariants()).toContain("relative");
    });

    it("puts a grid row's bar on its first cell, since a row can't hold a positioned child", () => {
        const classes = gridListTableRowThemeVariants({ selected: true });
        expect(classes).toContain("[&>td:first-child]:before:start-0");
        expect(classes).toContain("[&>td:first-child]:before:bg-(--color-selected-border)");
        expect(classes).toContain("forced-colors:[&>td:first-child]:before:bg-[Highlight]");
        expect(gridListTableRowThemeVariants({ selected: false })).not.toContain("before:");
    });

    it("gives a selected button a border in its text's color under high contrast and forced colors only", () => {
        const merged = (look: "default" | "ghost" | "outline" | "primary"): string[] =>
            twMerge(buttonThemeVariants({ look, selected: true })).split(/\s+/);
        for (const look of ["default", "outline", "ghost", "primary"] as const) {
            expect(merged(look)).toContain("after:border-current");
            expect(merged(look)).toContain("contrast-more:after:border-2");
            expect(merged(look)).toContain("forced-colors:after:border-2");
            expect(merged(look)).toContain("relative");
            expect(merged(look).some(c => /^after:border(-\d)?$/.test(c))).toBe(false);
        }
        expect(merged("default")).toContain("after:-inset-px");
        expect(merged("primary")).toContain("after:inset-0");
        expect(buttonThemeVariants({ look: "default" })).not.toContain("after:border-current");
    });
});

describe("what's drawn by a fill alone", () => {
    it.each([
        ["the slider's selection", sliderSelectionThemeVariants()],
        ["the progress bar", progressBarTrackThemeVariants()],
        ["the stepper's line", stepperTrackLineThemeVariants()],
        ["the radio's dot", radioButtonIndicatorThemeVariants()]
    ])("takes the indicator color for %s", (_label, classes) => {
        expect(classes).toContain(INDICATOR);
    });

    it("takes it for a switch that's on, with a handle that can be told apart", () => {
        expect(switchThemeVariants()).toContain(`data-[active='true']:${INDICATOR}`);
        expect(switchHandleThemeVariants()).toContain(
            "data-[active='true']:bg-[var(--mona-indicator-foreground,var(--color-primary-foreground))]"
        );
    });

    it("takes it for the active tab's bar", () => {
        expect(tabListListItemThemeVariants({ active: true })).toContain(`after:${INDICATOR}`);
    });
});

describe("a control's border", () => {
    it.each([
        ["a text box", textBoxThemeVariants()],
        ["a default button", buttonThemeVariants({ look: "default" })],
        ["an outline button", buttonThemeVariants({ look: "outline" })],
        ["a button group", buttonGroupThemeVariants()],
        ["segmented", segmentedContainerThemeVariants()],
        ["an outline chip", chipThemeVariants({ look: "outline" })]
    ])("shares the field border for %s, so they match side by side", (_label, classes) => {
        expect(classes).toContain("border-input-border");
    });

    it("shares the field border between an outline split button's parts", () => {
        const classes = splitButtonThemeVariants({ look: "outline" });
        expect(classes).toContain("[&>button:not(:last-child)]:border-input-border");
    });

    it("gives a slider's track one only for more contrast", () => {
        const classes = sliderTrackThemeVariants().split(/\s+/);
        expect(classes).not.toContain("border-input-border");
        expect(classes).toContain("contrast-more:border-input-border");
    });
});

describe("forced colors", () => {
    it.each([
        ["a text box's inner input", textBoxThemeVariants(), "[&>input:focus-visible]:outline-hidden"],
        ["a text box directive", inputThemeVariants(), "focus-visible:outline-hidden"],
        ["a numeric text box", numericTextboxThemeVariants(), "focus-visible:outline-hidden"],
        ["a check box's mark", checkmarkThemeVariants(), "peer-focus-visible:outline-hidden"],
        ["a radio's mark", radioButtonCircleThemeVariants(), "peer-focus-visible:outline-hidden"],
        ["the grid's row handle", gridRowReorderHandleThemeVariants(), "focus-visible:outline-hidden"],
        ["the editor's content", editorContainerThemeVariants(), "[&>.ProseMirror:focus-visible]:outline-hidden"]
    ])("keeps keyboard focus visible on %s, where a ring doesn't paint", (_label, classes, expected) => {
        expect(classes).toContain(expected);
    });

    it("doesn't outline a numeric text box at rest", () => {
        expect(numericTextboxThemeVariants().split(/\s+/)).not.toContain("outline-hidden");
    });

    it("gives every button a border, since a fill is what told it apart", () => {
        expect(buttonThemeVariants({ look: "primary" })).toContain("forced-colors:border-[ButtonBorder]");
    });

    it("keeps a selected day, over its hover and focus backgrounds", () => {
        const classes = calendarMonthViewDayThemeVariants({ selected: true });
        expect(classes).toContain("forced-colors:bg-[Highlight]!");
        expect(classes).toContain("forced-colors:text-[HighlightText]");
        // Without this, the browser paints a Canvas backplate behind the text, which leaves it white on white.
        expect(classes).toContain("forced-color-adjust-none");
    });

    it("keeps the slider's selection", () => {
        expect(sliderSelectionThemeVariants()).toContain("forced-colors:bg-[Highlight]");
    });

    it("keeps the radio's dot", () => {
        expect(radioButtonIndicatorThemeVariants()).toContain("forced-colors:bg-[Highlight]");
    });

    it("keeps a switch that's on", () => {
        const classes = switchThemeVariants();
        expect(classes).toContain("data-[active='true']:not-data-[disabled='true']:forced-colors:bg-[Highlight]");
        expect(classes).toContain("data-[active='true']:not-data-[disabled='true']:forced-color-adjust-none");
        // The handle sits on the track, and takes forced colors back rather than the theme's.
        expect(switchHandleThemeVariants()).toContain("forced-color-adjust-auto");
    });

    it("keeps the check box's marks", () => {
        expect(checkmarkThemeVariants()).toContain("forced-colors:peer-indeterminate:after:bg-[CanvasText]");
        expect(checkboxDirectiveThemeVariants()).toContain("forced-colors:checked:after:bg-[CanvasText]");
        expect(checkboxDirectiveThemeVariants()).toContain("forced-colors:indeterminate:after:bg-[CanvasText]");
    });

    it("keeps a circular progress bar's value and track apart", () => {
        const classes = circularProgressBarBaseThemeVariants();
        expect(classes).toContain("forced-colors:[&_svg_circle]:stroke-[Highlight]");
        expect(classes).toContain("forced-colors:[&_svg_circle]:data-[stroke-trail='true']:stroke-[GrayText]");
    });
});
