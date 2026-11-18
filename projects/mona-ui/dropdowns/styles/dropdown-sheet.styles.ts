import { cva } from "class-variance-authority";
import { themeOverlaySurfaceClasses } from "@nanahoshi/mona-ui/internal";

/**
 * The bottom sheet a dropdown's popup opens as on a small screen. Its rounded top edge faces the page; the bottom
 * padding keeps the content above the home indicator. `overflow-clip`, not `hidden`, so content that takes focus
 * during the slide-in can't scroll the sheet and cancel the animation.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
export const dropdownSheetThemeVariants = cva(
    `
        flex h-full max-h-[inherit] min-h-0 w-full flex-col overflow-clip
        rounded-t-xl border-t border-border
        pb-[env(safe-area-inset-bottom)] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]
        rtl:ps-[env(safe-area-inset-right)] rtl:pe-[env(safe-area-inset-left)]
        ${themeOverlaySurfaceClasses} text-foreground shadow-(--shadow-overlay)
    `
);

/**
 * A dropdown's popup surface inside the bottom sheet: the sheet draws the border, corners and shadow, and sets the
 * height, so the surface only fills it. Options and nodes are 44 pixels tall there, to be easy to tap.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
export const dropdownSheetSurfaceClasses = `
    h-full max-h-none flex-1 rounded-none border-0 shadow-none text-base
    [&_[role=option]]:min-h-11 [&_mona-tree-node>div]:py-2.5
`;
