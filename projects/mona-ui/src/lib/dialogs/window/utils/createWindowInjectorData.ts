import { WindowInjectorData } from "../models/WindowInjectorData";
import { WindowSettings } from "../models/WindowSettings";

export const createWindowInjectorData = (settings: Partial<WindowSettings>): WindowInjectorData => {
    return {
        actionTemplate: settings.actionTemplate,
        closable: settings.closable ?? true,
        closeOnEscape: settings.closeOnEscape ?? false,
        content: settings.content,
        draggable: settings.draggable ?? false,
        focusedElement: settings.focusedElement,
        footerTemplate: settings.footerTemplate,
        height: settings.height,
        left: settings.left,
        look: settings.look ?? "default",
        maxHeight: settings.maxHeight,
        maxWidth: settings.maxWidth,
        maximizable: settings.maximizable ?? true,
        minHeight: settings.minHeight ?? 50,
        minWidth: settings.minWidth ?? 50,
        minimizable: settings.minimizable ?? true,
        windowReference: null as never,
        rounded: settings.rounded ?? "medium",
        preventClose: settings.preventClose,
        resizable: settings.resizable ?? false,
        title: typeof settings.title === "string" ? settings.title : undefined,
        titleTemplate: typeof settings.title === "string" ? undefined : settings.title,
        top: settings.top,
        width: settings.width
    } as WindowInjectorData;
};
