import { compact } from "@mirei/ts-collections";
import { isIterable } from "rxjs/internal/util/isIterable";
import { WindowSettings } from "../window/models/WindowSettings";

export const setWindowStyles = (element: HTMLElement, settings: Partial<WindowSettings>): void => {
    if (!element) {
        return;
    }
    const classes = isIterable(settings.windowClass) ? [...settings.windowClass] : [settings.windowClass];
    compact(classes).forEach(className => element.classList.add(className));
    const minWidth = settings.minWidth ? `${settings.minWidth}px` : "";
    const minHeight = settings.minHeight ? `${settings.minHeight}px` : "";
    const maxWidth = settings.maxWidth ? `${settings.maxWidth}px` : "";
    const maxHeight = settings.maxHeight ? `${settings.maxHeight}px` : "";
    const top = settings.top ? `${settings.top}px` : `calc(50% - ${element.getBoundingClientRect().height / 2}px)`;
    const left = settings.left ? `${settings.left}px` : `calc(50% - ${element.getBoundingClientRect().width / 2}px)`;
    const position = "absolute";
    Object.assign(element.style, { left, maxHeight, maxWidth, minHeight, minWidth, position, top });
};
