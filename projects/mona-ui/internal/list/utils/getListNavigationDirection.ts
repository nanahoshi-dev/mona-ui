import { NavigationDirection } from "../models/NavigationDirection";

export const getListNavigationDirection = (key: string): NavigationDirection | null => {
    switch (key) {
        case "ArrowDown":
        case "Down":
            return "next";
        case "ArrowUp":
        case "Up":
            return "previous";
        case "Home":
            return "first";
        case "End":
            return "last";
        case "PageUp":
            return "pageup";
        case "PageDown":
            return "pagedown";
        default:
            return null;
    }
};
