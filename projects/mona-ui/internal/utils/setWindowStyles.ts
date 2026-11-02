export interface WindowStyleSettings {
    left?: number;
    maxHeight?: number;
    maxWidth?: number;
    minHeight?: number;
    minWidth?: number;
    top?: number;
    windowClass?: string | string[];
}

const toPixels = (value: number | undefined): string => (value != null ? `${value}px` : "");

export const setWindowStyles = (element: HTMLElement, settings: WindowStyleSettings): void => {
    if (!element) {
        return;
    }
    const classes = typeof settings.windowClass === "string" ? [settings.windowClass] : (settings.windowClass ?? []);
    classes
        .flatMap(className => (className ?? "").split(/\s+/))
        .filter(className => className !== "")
        .forEach(className => element.classList.add(className));
    const minWidth = toPixels(settings.minWidth);
    const minHeight = toPixels(settings.minHeight);
    const maxWidth = toPixels(settings.maxWidth);
    const maxHeight = toPixels(settings.maxHeight);
    const top =
        settings.top != null ? `${settings.top}px` : `calc(50% - ${element.getBoundingClientRect().height / 2}px)`;
    const left =
        settings.left != null ? `${settings.left}px` : `calc(50% - ${element.getBoundingClientRect().width / 2}px)`;
    const position = "absolute";
    Object.assign(element.style, { left, maxHeight, maxWidth, minHeight, minWidth, position, top });
};
