import type { DialogInjectorData } from "../models/DialogInjectorData";
import type { DialogSettings } from "../models/DialogSettings";

export const createDialogInjectorData = (settings: Partial<DialogSettings>): DialogInjectorData => {
    return {
        actions: settings.actions,
        actionsLayout: settings.actionsLayout ?? "end",
        ariaLabel: settings.ariaLabel,
        closable: settings.closable ?? true,
        closeOnEscape: settings.closeOnEscape ?? true,
        content: settings.content,
        data: settings.data,
        description: settings.description,
        descriptionTemplate: settings.descriptionTemplate,
        dialogReference: null as never,
        focusedElement: settings.focusedElement ?? null,
        footerTemplate: settings.footerTemplate,
        iconTemplate: settings.iconTemplate,
        messages: settings.messages,
        modal: settings.modal ?? true,
        rounded: settings.rounded ?? "medium",
        text: settings.text ?? "",
        title: settings.title,
        titleTemplate: settings.titleTemplate,
        type: settings.type
    };
};
