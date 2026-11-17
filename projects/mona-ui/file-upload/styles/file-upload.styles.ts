import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses } from "@nanahoshi/mona-ui/internal";

export const fileUploadThemeVariants = cva(`flex min-w-0 flex-col gap-2 text-sm text-foreground`);

/**
 * The drop zone. A dashed border sets it apart from a text box; dragging files over it makes the border solid and
 * fills it with the selected tint, and forced colors draw that border in Highlight instead, since the tint doesn't
 * paint there.
 */
export const fileUploadZoneThemeVariants = cva(
    `
        flex flex-col items-center justify-center gap-1
        px-4 py-6 text-center
        ${themeControlSurfaceClasses}
        rounded-md border border-dashed border-input-border
        cursor-pointer transition-colors
        not-data-[disabled='true']:not-data-[readonly='true']:hover:border-focus-indicator

        data-[dragging='true']:border-solid
        data-[dragging='true']:border-focus-indicator
        data-[dragging='true']:bg-selected
        data-[dragging='true']:text-selected-foreground
        forced-colors:data-[dragging='true']:border-[Highlight]

        data-[invalid='true']:border-error

        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[readonly='true']:cursor-default
    `
);

export const fileUploadZoneIconThemeVariants = cva(
    `mb-1 text-muted-foreground in-data-[disabled='true']:text-inherit in-data-[dragging='true']:text-inherit`
);

export const fileUploadZoneTextThemeVariants = cva(`font-medium`);

export const fileUploadRestrictionsThemeVariants = cva(
    `text-xs text-muted-foreground in-data-[disabled='true']:text-inherit in-data-[dragging='true']:text-inherit`
);

export const fileUploadBrowseThemeVariants = cva(`mt-2`);

export const fileUploadListThemeVariants = cva(`flex flex-col gap-1.5`);

export const fileUploadItemThemeVariants = cva(
    `
        flex items-center gap-3 min-w-0
        rounded-md border border-border px-3 py-2
        ${themeControlSurfaceClasses}
        data-[status='failed']:border-error
        data-[status='rejected']:border-error
    `
);

export const fileUploadItemIconThemeVariants = cva(`shrink-0`, {
    variants: {
        tone: {
            error: "text-error",
            muted: "text-muted-foreground",
            success: "text-success"
        }
    },
    defaultVariants: {
        tone: "muted"
    }
});

export const fileUploadItemBodyThemeVariants = cva(`flex min-w-0 flex-1 flex-col gap-1`);

export const fileUploadItemNameThemeVariants = cva(`truncate font-medium`);

export const fileUploadItemStatusThemeVariants = cva(`text-xs`, {
    variants: {
        tone: {
            error: "text-error",
            muted: "text-muted-foreground"
        }
    },
    defaultVariants: {
        tone: "muted"
    }
});

export const fileUploadItemProgressThemeVariants = cva(`h-1`);

export const fileUploadItemActionsThemeVariants = cva(`flex shrink-0 items-center gap-1`);

export const fileUploadActionsThemeVariants = cva(`flex justify-end gap-2`);
