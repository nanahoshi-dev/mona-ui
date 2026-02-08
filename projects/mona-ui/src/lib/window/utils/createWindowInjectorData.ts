import { WindowInjectorData } from "../models/WindowInjectorData";
import { WindowSettings } from "../models/WindowSettings";

export const createWindowInjectorData = (settings: Partial<WindowSettings>): WindowInjectorData => {
    return {
        closeOnEscape: settings.closeOnEscape ?? false,
        content: settings.content,
        draggable: settings.draggable ?? false,
        focusedElement: settings.focusedElement,
        footerTemplate: settings.footerTemplate,
        height: settings.height,
        left: settings.left,
        maxHeight: settings.maxHeight ?? window.innerHeight,
        maxWidth: settings.maxWidth ?? window.innerWidth,
        minHeight: settings.minHeight ?? 50,
        minWidth: settings.minWidth ?? 50,
        windowReference: null as any,
        rounded: settings.rounded ?? "medium",
        preventClose: settings.preventClose,
        resizable: settings.resizable ?? false,
        title: typeof settings.title === "string" ? settings.title : undefined,
        titleTemplate: typeof settings.title === "string" ? undefined : settings.title,
        top: settings.top,
        width: settings.width
    } as WindowInjectorData;
};
