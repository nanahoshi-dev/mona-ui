import { themeControlSurfaceClasses } from "@nanahoshi/mona-ui/internal";
import { cva } from "class-variance-authority";

/** A chat is a panel, 32rem tall unless a class sizes it, with its messages scrolling above the message box. */
export const chatBaseThemeVariants = cva(`
    flex h-128 w-full min-w-0 flex-col overflow-hidden
    rounded-lg border border-border bg-surface text-foreground
`);

/** Holds the messages and, over their bottom edge, the button to the newest ones. */
export const CHAT_LOG_FRAME_CLASSES = "relative flex min-h-0 flex-1 flex-col";

/** The messages scroll. Focus is inset, as the panel clips anything outside it. */
export const CHAT_LOG_CLASSES = `
    flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4
    focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator
`;

/** The empty chat's text, or its template, in the middle of the messages' space. */
export const CHAT_EMPTY_CLASSES = "m-auto max-w-full text-center text-sm text-muted-foreground";

export const CHAT_DAY_CLASSES = "flex flex-col gap-4";

/** The day's label, between two rules. */
export const CHAT_DAY_LABEL_CLASSES = `
    flex items-center gap-3 text-xs font-medium text-muted-foreground
    before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border
    forced-colors:before:bg-[GrayText] forced-colors:after:bg-[GrayText]
`;

/** A run of messages: the user's at the end, others' at the start, after their avatar. */
export const chatRunThemeVariants = cva("flex min-w-0 gap-2", {
    variants: {
        mine: {
            true: "justify-end",
            false: "justify-start"
        }
    },
    defaultVariants: {
        mine: false
    }
});

export const CHAT_AVATAR_CLASSES = "mt-5 shrink-0";

export const chatRunBodyThemeVariants = cva("flex min-w-0 max-w-[min(36rem,85%)] flex-col gap-1", {
    variants: {
        mine: {
            true: "items-end",
            false: "items-start"
        }
    },
    defaultVariants: {
        mine: false
    }
});

export const CHAT_AUTHOR_CLASSES = "px-1 text-xs font-medium text-muted-foreground";

/**
 * A message's bubble. The transparent border is drawn in forced colors, where its fill isn't. A paragraph just before
 * the caret of a message streaming in runs inline, so the caret follows its last word.
 */
export const chatBubbleThemeVariants = cva(
    "max-w-full min-w-0 rounded-2xl border border-transparent px-3 py-2 text-sm wrap-break-word [&>p:has(+[data-chat-caret])]:inline",
    {
        variants: {
            mine: {
                true: "bg-primary text-primary-foreground",
                false: "bg-surface-muted text-foreground"
            },
            sending: {
                true: "opacity-70",
                false: ""
            }
        },
        defaultVariants: {
            mine: false,
            sending: false
        }
    }
);

export const CHAT_TEXT_CLASSES = "m-0 whitespace-pre-wrap";

/** The caret at the end of a message that's streaming in. It doesn't blink for users who prefer less motion. */
export const CHAT_CARET_CLASSES = `
    ms-0.5 inline-block h-[1em] w-[0.45em] translate-y-[0.15em] rounded-[1px] bg-current
    animate-pulse motion-reduce:animate-none forced-color-adjust-none forced-colors:bg-[CanvasText]
`;

export const CHAT_ATTACHMENTS_CLASSES = "m-0 mt-2 flex list-none flex-col gap-1.5 p-0 first:mt-0";

export const CHAT_ATTACHMENT_CLASSES = "flex min-w-0 flex-col gap-1";

export const CHAT_ATTACHMENT_IMAGE_CLASSES = "block max-h-48 max-w-full rounded-lg object-cover";

export const CHAT_ATTACHMENT_ROW_CLASSES = "flex min-w-0 items-center gap-1.5";

export const chatAttachmentLinkThemeVariants = cva("min-w-0 truncate underline underline-offset-2", {
    variants: {
        mine: {
            true: "text-primary-foreground",
            false: "text-foreground"
        }
    },
    defaultVariants: {
        mine: false
    }
});

export const CHAT_ATTACHMENT_SIZE_CLASSES = "shrink-0 text-xs opacity-80";

export const CHAT_STATUS_CLASSES = "flex items-center gap-2 px-1 text-xs text-muted-foreground";

export const CHAT_FAILED_CLASSES = "flex items-center gap-2 px-1 text-xs text-error";

export const CHAT_TIME_CLASSES = "px-1 text-xs text-muted-foreground";

/** Over the bottom of the messages, in the middle. */
export const CHAT_NEW_MESSAGES_CLASSES = "absolute inset-x-0 bottom-3 mx-auto w-fit shadow-(--shadow-raised)";

export const CHAT_TYPING_CLASSES = "flex min-h-5 items-center gap-2 px-4 text-xs text-muted-foreground";

/** Three dots that rise in turn, or sit still for users who prefer less motion. */
export const CHAT_TYPING_DOTS_CLASSES = `
    flex items-center gap-0.5
    [&>span]:size-1 [&>span]:rounded-full [&>span]:bg-current
    [&>span]:animate-bounce motion-reduce:[&>span]:animate-none
    [&>span:nth-child(2)]:[animation-delay:150ms] [&>span:nth-child(3)]:[animation-delay:300ms]
    forced-color-adjust-none forced-colors:[&>span]:bg-[CanvasText]
`;

export const CHAT_SUGGESTIONS_CLASSES = "flex flex-wrap gap-2 px-4 pt-1";

export const CHAT_COMPOSER_CLASSES = "flex flex-col gap-2 p-3";

export const CHAT_FILES_CLASSES = "m-0 flex list-none flex-wrap gap-2 p-0";

export const CHAT_FILE_CLASSES = `
    flex max-w-full min-w-0 items-center gap-1.5 rounded-md border border-border bg-surface-muted
    py-0.5 ps-2 pe-0.5 text-xs
`;

export const CHAT_FILE_NAME_CLASSES = "min-w-0 truncate";

/** The message box and its buttons, framed as a text box is, with its focus ring around them all. */
export const CHAT_FIELD_CLASSES = `
    flex items-end gap-1 rounded-xl p-1
    ${themeControlSurfaceClasses}
    border border-input-border shadow-(--shadow-control)
    transition-[color,box-shadow,border] duration-(--mona-motion-standard) ease-in-out
    focus-within:border-focus-indicator focus-within:ring-(length:--mona-focus-ring-width,2px) focus-within:ring-focus-indicator/(--mona-focus-ring-opacity,35%)
    data-[disabled]:cursor-not-allowed data-[disabled]:border-disabled-border data-[disabled]:bg-disabled-background
    data-[disabled]:shadow-none
`;

/** Grows with its text up to ten lines, then scrolls. */
export const CHAT_TEXTAREA_CLASSES = `
    max-h-60 min-h-8 min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-foreground
    outline-none focus-visible:outline-hidden placeholder:text-muted-foreground
    disabled:cursor-not-allowed disabled:text-disabled-foreground
`;
