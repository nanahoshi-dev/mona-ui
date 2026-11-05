import type { ElementRef, Injector, TemplateRef, Type } from "@angular/core";
import type { DialogMessages } from "@nanahoshi/mona-ui/i18n";
import type { DialogVariantProps } from "../styles/dialog.styles";
import type { ActionsLayout } from "./ActionsLayout";
import type { DialogAction } from "./DialogAction";

export interface DialogSettings<D = unknown> {
    actions?: Iterable<DialogAction>;
    actionsLayout?: ActionsLayout;
    /** Accessible name for the dialog when it has no `title` or `titleTemplate`. */
    ariaLabel?: string;
    closable?: boolean;
    closeOnEscape?: boolean;
    /**
     * The dialog's body: a template, or a component. A template gets the dialog's `data` as `$implicit` and the
     * `DialogRef` as `dialogRef`; a component can inject `DIALOG_DATA` and `DialogRef`.
     */
    content?: TemplateRef<unknown> | Type<unknown>;
    /** Data for the content: `DIALOG_DATA` in a component, `$implicit` in a template. */
    data?: D;
    description?: string;
    descriptionTemplate?: TemplateRef<unknown>;
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    footerTemplate?: TemplateRef<unknown>;
    height?: number;
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
    messages?: Partial<DialogMessages>;
    minHeight?: number;
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
    rounded?: DialogVariantProps["rounded"];
    text?: string;
    title?: string;
    titleTemplate?: TemplateRef<unknown>;
    /** Distance from the viewport's top edge in pixels. When omitted, the dialog is centered vertically. */
    top?: number;
    type?: DialogVariantProps["type"];
    width?: number;
}
