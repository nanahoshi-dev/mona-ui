import type { ElementRef, Injector, TemplateRef, Type } from "@angular/core";
import type { DialogMessages } from "@nanahoshi/mona-ui/i18n";
import type { DialogVariantProps } from "../styles/dialog.styles";
import type { ActionsLayout } from "./ActionsLayout";
import type { DialogAction } from "./DialogAction";

/**
 * The settings object accepted by `DialogService.show()`. Fields mirror the `DialogComponent` inputs of the same name
 * (`actions`, `actionsLayout`, `ariaLabel`, `closable`, `closeOnEscape`, `description`, `focusedElement`, `height`,
 * `left`, `maxHeight`, `maxWidth`, `minHeight`, `minWidth`, `modal`, `rounded`, `text`, `title`, `top`, `type`,
 * `width`), plus these service-only fields:
 */
export interface DialogSettings<D = unknown> {
    /**
     * The buttons in the dialog footer. When omitted, the dialog shows an OK button, plus a Cancel button when `type`
     * is `"confirm"`. Pass an empty list for no buttons.
     */
    actions?: Iterable<DialogAction>;
    /**
     * How the action buttons are aligned in the footer.
     * @default "end"
     */
    actionsLayout?: ActionsLayout;
    /** Accessible name for the dialog when it has no `title` or `titleTemplate`. */
    ariaLabel?: string;
    /**
     * Whether the header shows a close button.
     * @default true
     */
    closable?: boolean;
    /**
     * Whether pressing Escape closes the dialog.
     * @default true
     */
    closeOnEscape?: boolean;
    /**
     * The dialog's body: a template, or a component. A template gets the dialog's `data` as `$implicit` and the
     * `DialogRef` as `dialogRef`; a component can inject `DIALOG_DATA` and `DialogRef`.
     */
    content?: TemplateRef<unknown> | Type<unknown>;
    /** Data for the content: `DIALOG_DATA` in a component, `$implicit` in a template. */
    data?: D;
    /** Text shown under the title, and used as the dialog's accessible description. */
    description?: string;
    /** Template rendered in place of `description`. */
    descriptionTemplate?: TemplateRef<unknown>;
    /**
     * The element that receives focus when the dialog opens: an element, an element reference, or a CSS selector
     * matched inside the dialog. When omitted, focus moves to the first focusable element.
     */
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    /** Template rendered in place of the generated action-button row. */
    footerTemplate?: TemplateRef<unknown>;
    /** Height in pixels. When omitted, the dialog fits its content. */
    height?: number;
    /** Template rendered in place of the built-in `type` icon. */
    iconTemplate?: TemplateRef<unknown>;
    /**
     * Parent injector for the dialog's content, so a component given as `content` can inject what the opener
     * provides. Defaults to the application injector.
     */
    injector?: Injector;
    /** Distance from the viewport's left edge in pixels. When omitted, the dialog is centered horizontally. */
    left?: number;
    /** Maximum height in pixels. When omitted, the dialog stays 1rem inside the viewport and its body scrolls. */
    maxHeight?: number;
    /** Maximum width in pixels. When omitted, the dialog stays 1rem inside the viewport. */
    maxWidth?: number;
    /** Overrides for the dialog's messages (close button label, OK, Cancel). */
    messages?: Partial<DialogMessages>;
    /** Minimum height in pixels. */
    minHeight?: number;
    /** Minimum width in pixels. */
    minWidth?: number;
    /**
     * Whether the dialog is modal: a backdrop, `aria-modal="true"`, focus kept inside, page scroll locked, and the
     * rest of the page inert. A non-modal dialog does none of these.
     * @default true
     */
    modal?: boolean;
    /**
     * Whether focus goes back to where it was when the dialog opened, once it closes.
     * @default true
     */
    restoreFocus?: boolean;
    /**
     * Border-radius preset for the dialog and its action buttons.
     * @default "medium"
     */
    rounded?: DialogVariantProps["rounded"];
    /** Text shown in the dialog's body when no `content` is given. */
    text?: string;
    /** Text shown in the dialog header, and used as the dialog's accessible name. */
    title?: string;
    /** Template rendered in place of `title`. */
    titleTemplate?: TemplateRef<unknown>;
    /** Distance from the viewport's top edge in pixels. When omitted, the dialog is centered vertically. */
    top?: number;
    /**
     * The dialog's severity, which picks its icon. `"confirm"`, `"error"` and `"warning"` give the dialog the
     * `alertdialog` role. When omitted, `show()` renders no icon; `alert()` uses `"info"` and `confirm()` uses
     * `"confirm"`.
     */
    type?: DialogVariantProps["type"];
    /** Width in pixels. When omitted, the dialog fits its content. */
    width?: number;
}
