import { DialogAction } from "../models/DialogAction";
import { DialogInjectorData } from "../models/DialogInjectorData";
import { DialogSettings } from "../models/DialogSettings";
import { DialogVariantProps } from "../styles/dialog.styles";

export const createDialogInjectorData = (settings: Partial<DialogSettings>): DialogInjectorData => {
    return {
        actions: settings.actions ?? getDefaultActions(settings.type),
        actionsLayout: settings.actionsLayout ?? "stretched",
        closable: settings.closable ?? true,
        closeOnEscape: settings.closeOnEscape ?? true,
        content: settings.content,
        description: settings.description,
        descriptionTemplate: settings.descriptionTemplate,
        dialogReference: null as never,
        focusedElement: settings.focusedElement ?? null,
        footerTemplate: settings.footerTemplate,
        height: settings.height,
        left: settings.left,
        maxHeight: settings.maxHeight ?? window.innerHeight,
        maxWidth: settings.maxWidth ?? window.innerWidth,
        minHeight: settings.minHeight ?? 50,
        minWidth: settings.minWidth ?? 50,
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

function getDefaultActions(type: DialogVariantProps["type"] | undefined): DialogAction[] {
    if (type === "confirm") {
        return [
            { cssClass: "", iconOnly: false, look: "primary", rounded: "medium", text: "OK" },
            { cssClass: "", iconOnly: false, look: "default", rounded: "medium", text: "Cancel" }
        ];
    }
    return [{ cssClass: "", iconOnly: false, look: "primary", rounded: "medium", text: "OK" }];
}
