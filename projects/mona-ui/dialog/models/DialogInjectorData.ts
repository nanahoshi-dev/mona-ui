import type { ElementRef, TemplateRef, Type } from "@angular/core";
import type { DialogMessages } from "@nanahoshi/mona-ui/i18n";
import type { DialogVariantProps } from "../styles/dialog.styles";
import type { ActionsLayout } from "./ActionsLayout";
import type { DialogAction } from "./DialogAction";
import type { DialogReference } from "./DialogReference";

export interface DialogInjectorData {
    actions?: Iterable<DialogAction>;
    actionsLayout: ActionsLayout;
    ariaLabel?: string;
    closable?: boolean;
    closeOnEscape?: boolean;
    content?: TemplateRef<unknown> | Type<unknown>;
    data?: unknown;
    description?: string;
    descriptionTemplate?: TemplateRef<unknown>;
    dialogReference: DialogReference;
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    footerTemplate?: TemplateRef<unknown>;
    iconTemplate?: TemplateRef<unknown>;
    messages?: Partial<DialogMessages>;
    modal?: boolean;
    rounded: DialogVariantProps["rounded"];
    text?: string;
    title?: string;
    titleTemplate?: TemplateRef<unknown>;
    type?: DialogVariantProps["type"];
}
