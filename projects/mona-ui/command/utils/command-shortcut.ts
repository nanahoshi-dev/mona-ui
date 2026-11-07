export interface CommandKey {
    /** What a screen reader should say. */
    readonly name: string;
    /** What the key looks like on the keyboard. */
    readonly symbol: string;
}

interface ParsedShortcut {
    readonly alt: boolean;
    readonly control: boolean;
    readonly key: string;
    readonly meta: boolean;
    readonly shift: boolean;
}

const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;
const EDITABLE = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

export const isApplePlatform = (view: Window | null): boolean => APPLE_PLATFORM.test(view?.navigator.platform ?? "");

const parseShortcut = (shortcut: string, apple: boolean): ParsedShortcut => {
    const parts = shortcut.toLowerCase().split("+");
    const has = (name: string): boolean => parts.slice(0, -1).includes(name);
    return {
        alt: has("alt"),
        control: has("ctrl") || (has("mod") && !apple),
        key: parts.at(-1) ?? "",
        meta: has("meta") || (has("mod") && apple),
        shift: has("shift")
    };
};

/** Whether a key press is this shortcut. A shortcut without Ctrl, Alt or Meta doesn't fire while the user is typing. */
export const matchesShortcut = (event: KeyboardEvent, shortcut: string, apple: boolean): boolean => {
    const parsed = parseShortcut(shortcut, apple);
    if (
        event.key?.toLowerCase() !== parsed.key ||
        event.altKey !== parsed.alt ||
        event.ctrlKey !== parsed.control ||
        event.metaKey !== parsed.meta ||
        event.shiftKey !== parsed.shift
    ) {
        return false;
    }
    if (parsed.alt || parsed.control || parsed.meta) {
        return true;
    }
    return !(event.target instanceof Element && event.target.closest(EDITABLE));
};

const appleKey = (part: string): CommandKey | null => {
    switch (part) {
        case "alt":
            return { name: "Option", symbol: "\u2325" };
        case "ctrl":
            return { name: "Control", symbol: "\u2303" };
        case "meta":
        case "mod":
            return { name: "Command", symbol: "\u2318" };
        case "shift":
            return { name: "Shift", symbol: "\u21E7" };
        default:
            return null;
    }
};

const otherKey = (part: string): CommandKey | null => {
    switch (part) {
        case "alt":
            return { name: "Alt", symbol: "Alt" };
        case "ctrl":
        case "mod":
            return { name: "Control", symbol: "Ctrl" };
        case "meta":
            return { name: "Meta", symbol: "Meta" };
        case "shift":
            return { name: "Shift", symbol: "Shift" };
        default:
            return null;
    }
};

/** The keys of a shortcut as the platform writes them: `mod+k` is Ctrl and K, or Command and K on Apple devices. */
export const describeShortcut = (shortcut: string, apple: boolean): readonly CommandKey[] =>
    shortcut
        .toLowerCase()
        .split("+")
        .map(part => {
            const modifier = apple ? appleKey(part) : otherKey(part);
            const key = part.length === 1 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1);
            return modifier ?? { name: key, symbol: key };
        });
