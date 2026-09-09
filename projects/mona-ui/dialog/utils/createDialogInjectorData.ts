import { DialogInjectorData } from "../models/DialogInjectorData";
import { DialogSettings } from "../models/DialogSettings";

export const createDialogInjectorData = (settings: Partial<DialogSettings>): DialogInjectorData => {
    return {
        actions: settings.actions,
        actionsLayout: settings.actionsLayout ?? "end",
        closable: settings.closable ?? true,
        closeOnEscape: settings.closeOnEscape ?? true,
        content: settings.content,
        description: settings.description,
        descriptionTemplate: settings.descriptionTemplate,
        dialogReference: null as never,
        focusedElement: settings.focusedElement ?? null,
        footerTemplate: settings.footerTemplate,
        height: settings.height,
        iconTemplate: settings.iconTemplate,
        left: settings.left,
        messages: settings.messages,
        modal: settings.modal ?? true,
        rounded: settings.rounded ?? "medium",
        text: settings.text ?? "",
        title: settings.title,
        titleTemplate: settings.titleTemplate,
        top: settings.top,
        type: settings.type,
        width: settings.width ?? 450
    };
};
