import { themeRaisedBackdropClasses } from "@nanahoshi/mona-ui/internal";
import { cva } from "class-variance-authority";

/**
 * How a timeline's events are laid out: down one side of the line (`vertical`), on alternating sides of it once the
 * timeline is 32rem wide (`alternate`, down one side below that), or across the page (`horizontal`).
 */
export type TimelineLayout = "alternate" | "horizontal" | "vertical";

/**
 * The timeline fills its container's width, also as a flex item: a horizontal one would grow to all its events
 * otherwise, and an alternating one, a size container that lays its events out by its own width, would have none. The
 * width of a horizontal timeline's events is the `--mona-timeline-event-width` custom property, which a class can set.
 */
export const timelineBaseThemeVariants = cva("block w-full min-w-0 [--mona-timeline-event-width:16rem]", {
    variants: {
        container: {
            true: "@container",
            false: ""
        }
    },
    defaultVariants: {
        container: false
    }
});

/**
 * A horizontal timeline scrolls sideways. Its events are columns of three rows, which each event shares through
 * subgrid, so the line runs straight whatever their heights; the padding keeps focus outlines clear of its edge.
 */
export const timelineListThemeVariants = cva("m-0 list-none p-0", {
    variants: {
        horizontal: {
            true: `
                grid auto-cols-(--mona-timeline-event-width) grid-flow-col grid-rows-[auto_auto_auto]
                overflow-x-auto overscroll-x-contain px-1 pt-1 pb-3
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-indicator
            `,
            false: "flex flex-col"
        }
    },
    defaultVariants: {
        horizontal: false
    }
});

/**
 * A vertical event is a grid of the line's column and the event's. `--mona-timeline-marker-center` is how far down the
 * event the marker's center is: halfway down the date label above the card, or, on alternating sides, halfway down the
 * card's first line, beside which the date then sits.
 */
export const timelineItemThemeVariants = cva("relative min-w-0", {
    variants: {
        layout: {
            vertical: "grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 [--mona-timeline-marker-center:0.5rem]",
            alternate: `
                grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 [--mona-timeline-marker-center:0.5rem]
                @min-[32rem]:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] @min-[32rem]:gap-x-4
                @min-[32rem]:[--mona-timeline-marker-center:calc(1.375rem+1px)]
            `,
            horizontal: "row-span-3 grid grid-rows-subgrid"
        }
    },
    defaultVariants: {
        layout: "vertical"
    }
});

/** On alternating sides, a flipped event has its card before the line and its date after it. */
export const timelineDateThemeVariants = cva("min-w-0 text-xs leading-4 font-medium text-muted-foreground", {
    variants: {
        layout: {
            vertical: "col-start-2 row-start-1 pb-2",
            alternate: `
                col-start-2 row-start-1 pb-2
                @min-[32rem]:pt-[calc(var(--mona-timeline-marker-center)-0.5rem)] @min-[32rem]:pb-0
            `,
            horizontal: "px-2 text-center"
        },
        flipped: {
            true: "",
            false: ""
        }
    },
    compoundVariants: [
        { layout: "alternate", flipped: false, class: "@min-[32rem]:col-start-1 @min-[32rem]:text-end" },
        { layout: "alternate", flipped: true, class: "@min-[32rem]:col-start-3" },
        { layout: "horizontal", flipped: false, class: "row-start-1 self-end pb-2" },
        { layout: "horizontal", flipped: true, class: "row-start-3 self-start pt-2" }
    ],
    defaultVariants: {
        layout: "vertical",
        flipped: false
    }
});

/** The line's column, or row, which the marker sits in. It runs through the space between events. */
export const timelineAxisThemeVariants = cva("relative flex justify-center", {
    variants: {
        layout: {
            vertical: "col-start-1 row-span-2 row-start-1",
            alternate: "col-start-1 row-span-2 row-start-1 @min-[32rem]:col-start-2 @min-[32rem]:row-span-1",
            horizontal: "row-start-2 items-center"
        }
    },
    defaultVariants: {
        layout: "vertical"
    }
});

/**
 * The line joins the markers: from the first marker to the last one, so it starts and ends at a marker. It's a border,
 * which forced colors draw in the text color.
 */
export const timelineLineThemeVariants = cva("pointer-events-none absolute border-border", {
    variants: {
        horizontal: {
            true: "top-[calc(50%-1px)] border-t-2",
            false: "start-[calc(50%-1px)] border-s-2"
        },
        first: {
            true: "",
            false: ""
        },
        last: {
            true: "",
            false: ""
        }
    },
    compoundVariants: [
        { horizontal: false, first: true, class: "top-(--mona-timeline-marker-center)" },
        { horizontal: false, first: false, class: "top-0" },
        { horizontal: false, last: true, class: "bottom-[calc(100%-var(--mona-timeline-marker-center))]" },
        { horizontal: false, last: false, class: "bottom-0" },
        { horizontal: true, first: true, class: "start-1/2" },
        { horizontal: true, first: false, class: "start-0" },
        { horizontal: true, last: true, class: "end-1/2" },
        { horizontal: true, last: false, class: "end-0" }
    ],
    defaultVariants: {
        horizontal: false,
        first: false,
        last: false
    }
});

/**
 * The marker is centered on the line, and on a vertical timeline on `--mona-timeline-marker-center`. A larger marker of
 * a template's stays centered there; on a horizontal timeline, its row grows to fit it.
 */
export const timelineMarkerThemeVariants = cva("relative flex items-center justify-center", {
    variants: {
        horizontal: {
            true: "min-h-4",
            false: "mt-[calc(var(--mona-timeline-marker-center)-0.5rem)] h-4"
        }
    },
    defaultVariants: {
        horizontal: false
    }
});

/** The dot is filled with the primary color, and with the text color in forced colors. */
export const TIMELINE_DOT_CLASSES = `
    block size-3 rounded-full border-2 border-primary bg-primary
    forced-color-adjust-none forced-colors:border-[CanvasText] forced-colors:bg-[CanvasText]
`;

/** The space between vertical events is the card's, so the line's column, which spans the event, runs through it. */
export const timelineContentThemeVariants = cva("min-w-0", {
    variants: {
        layout: {
            vertical: "col-start-2 row-start-2",
            alternate: "col-start-2 row-start-2 @min-[32rem]:row-start-1",
            horizontal: "px-2"
        },
        flipped: {
            true: "",
            false: ""
        },
        last: {
            true: "",
            false: ""
        }
    },
    compoundVariants: [
        { layout: ["alternate", "vertical"], last: false, class: "pb-6" },
        { layout: "alternate", flipped: false, class: "@min-[32rem]:col-start-3" },
        { layout: "alternate", flipped: true, class: "@min-[32rem]:col-start-1" },
        { layout: "horizontal", flipped: false, class: "row-start-3 pt-3" },
        { layout: "horizontal", flipped: true, class: "row-start-1 self-end pb-3" }
    ],
    defaultVariants: {
        layout: "vertical",
        flipped: false,
        last: false
    }
});

export const timelineCardThemeVariants = cva(
    `
        min-w-0 rounded-lg border border-border
        bg-card text-card-foreground shadow-(--shadow-raised)
        ${themeRaisedBackdropClasses}
    `,
    {
        variants: {
            collapsible: {
                true: "",
                false: "flex flex-col gap-1 p-3"
            }
        },
        defaultVariants: {
            collapsible: false
        }
    }
);

/** The whole header of a collapsible card opens its details. Inset focus, so the card's border doesn't hide it. */
export const TIMELINE_TRIGGER_CLASSES = `
    flex w-full cursor-pointer items-start gap-2 rounded-[inherit] p-3 text-start
    data-[state=open]:rounded-b-none
    transition-colors duration-(--mona-motion-fast) motion-reduce:transition-none
    hover:bg-hover active:bg-active
    focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator
`;

export const TIMELINE_HEADER_CLASSES = "flex min-w-0 flex-1 flex-col gap-0.5";

export const TIMELINE_TITLE_CLASSES = "block text-sm leading-5 font-semibold text-card-foreground";

export const TIMELINE_SUBTITLE_CLASSES = "block text-xs leading-4 text-muted-foreground";

export const timelineChevronThemeVariants = cva(
    `
        mt-0.5 size-4 shrink-0 text-muted-foreground
        transition-transform duration-(--mona-motion-fast) motion-reduce:transition-none
    `,
    {
        variants: {
            expanded: {
                true: "rotate-180",
                false: ""
            }
        },
        defaultVariants: {
            expanded: false
        }
    }
);

/** The details of a collapsible card. Its padding closes with it. */
export const TIMELINE_COLLAPSIBLE_BODY_CLASSES = "px-3 pb-3 text-sm text-muted-foreground";

export const TIMELINE_BODY_CLASSES = "text-sm text-muted-foreground";
