import type { WindowInjectorData } from "../models/WindowInjectorData";
import type { WindowSettings } from "../models/WindowSettings";
import { DEFAULT_MIN_WINDOW_HEIGHT, DEFAULT_MIN_WINDOW_WIDTH } from "./defaults";

export const createWindowInjectorData = (
    settings: Partial<WindowSettings>
): Omit<WindowInjectorData, "windowReference"> => {
    return {
        actionTemplate: settings.actionTemplate,
        ariaLabel: settings.ariaLabel,
        closable: settings.closable ?? true,
        closeOnEscape: settings.closeOnEscape ?? true,
        content: settings.content,
        data: settings.data,
        draggable: settings.draggable ?? false,
        focusedElement: settings.focusedElement,
        footerTemplate: settings.footerTemplate,
        height: settings.height,
        left: settings.left,
        look: settings.look ?? "default",
        maxHeight: settings.maxHeight,
        maxWidth: settings.maxWidth,
        maximizable: settings.maximizable ?? true,
        messages: settings.messages,
        minHeight: settings.minHeight ?? DEFAULT_MIN_WINDOW_HEIGHT,
        minWidth: settings.minWidth ?? DEFAULT_MIN_WINDOW_WIDTH,
        minimizable: settings.minimizable ?? true,
        modal: settings.modal,
        resizable: settings.resizable ?? false,
        rounded: settings.rounded ?? "medium",
        title: typeof settings.title === "string" ? settings.title : undefined,
        titleTemplate: typeof settings.title === "string" ? undefined : settings.title,
        top: settings.top,
        width: settings.width
    };
};
