/** Marks the controls the toolbar manages, so they are still found once their Tab stop is set to -1. */
const ITEM_MARKER = "data-mona-toolbar-item";

const ITEM_SELECTOR = `:is(button, input, select, textarea, a[href], [tabindex]):not([tabindex='-1']), [${ITEM_MARKER}]`;

/** Input types whose Left and Right arrows don't do anything, so the toolbar can use them. */
const BUTTON_LIKE_INPUT_TYPES = new Set(["button", "checkbox", "color", "file", "image", "radio", "reset", "submit"]);

/** Roles of widgets that use Left and Right themselves. A select-only combobox uses only Up and Down. */
const HORIZONTAL_KEY_ROLES = new Set(["radiogroup", "searchbox", "slider", "spinbutton", "tablist", "textbox"]);

function usesHorizontalArrows(element: HTMLElement): boolean {
    if (element instanceof HTMLInputElement) {
        return !BUTTON_LIKE_INPUT_TYPES.has(element.type);
    }
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element.isContentEditable) {
        return true;
    }
    const role = element.getAttribute("role");
    return role != null && HORIZONTAL_KEY_ROLES.has(role);
}

function isUnavailable(element: HTMLElement): boolean {
    const disabled =
        (element instanceof HTMLButtonElement ||
            element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement) &&
        element.disabled;
    return (
        disabled ||
        element.hasAttribute("disabled") ||
        element.getAttribute("aria-disabled") === "true" ||
        element.closest("[hidden], [aria-hidden='true']") != null
    );
}

/**
 * The keyboard of an APG toolbar over controls that other components render: one Tab stop, Left and Right (mirrored
 * in right-to-left text) to move between controls, Home and End to the ends. Disabled and hidden controls are
 * skipped; a control inside another one (a button inside a combobox) belongs to it.
 *
 * Call {@link sync} after every render, so controls added later join the Tab stop, and forward the toolbar's
 * `focusin` and `keydown` events.
 */
export class RovingToolbar {
    readonly #element: () => HTMLElement | null | undefined;
    #active: HTMLElement | null = null;
    #activeIndex = 0;

    public constructor(element: () => HTMLElement | null | undefined) {
        this.#element = element;
    }

    /** The Tab stop follows focus, also when a control is clicked. */
    public onFocusIn(event: FocusEvent): void {
        const target = event.target as HTMLElement;
        const item = this.#targets().find(candidate => candidate === target || candidate.contains(target));
        if (item != null && item !== this.#active) {
            this.#active = item;
            this.sync();
        }
    }

    public onKeydown(event: KeyboardEvent): void {
        const key = event.key;
        if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End") {
            return;
        }
        const target = event.target as HTMLElement;
        if (
            event.defaultPrevented ||
            event.isComposing ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            usesHorizontalArrows(target)
        ) {
            return;
        }
        const targets = this.#targets();
        const currentIndex = targets.findIndex(item => item === target || item.contains(target));
        if (currentIndex === -1) {
            return;
        }
        event.preventDefault();
        let nextIndex: number;
        if (key === "Home") {
            nextIndex = 0;
        } else if (key === "End") {
            nextIndex = targets.length - 1;
        } else {
            const element = this.#element();
            const rtl = element?.ownerDocument.defaultView?.getComputedStyle(element).direction === "rtl";
            const step = (key === "ArrowRight") !== rtl ? 1 : -1;
            nextIndex = (currentIndex + step + targets.length) % targets.length;
        }
        this.#active = targets[nextIndex];
        this.sync();
        targets[nextIndex].focus();
    }

    /** Gives the active control the Tab stop and takes it from the others. */
    public sync(): void {
        const targets = this.#targets();
        if (targets.length === 0) {
            return;
        }
        const itemIndex = this.#active == null ? -1 : targets.indexOf(this.#active);
        const activeIndex = itemIndex !== -1 ? itemIndex : Math.min(this.#activeIndex, targets.length - 1);
        this.#active = targets[activeIndex];
        this.#activeIndex = activeIndex;
        for (const [index, target] of targets.entries()) {
            const tabIndex = index === activeIndex ? "0" : "-1";
            if (target.getAttribute("tabindex") !== tabIndex) {
                target.setAttribute("tabindex", tabIndex);
            }
            if (!target.hasAttribute(ITEM_MARKER)) {
                target.setAttribute(ITEM_MARKER, "");
            }
        }
    }

    #targets(): HTMLElement[] {
        const element = this.#element();
        if (element == null) {
            return [];
        }
        const candidates = Array.from(element.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
            candidate => !isUnavailable(candidate)
        );
        return candidates.filter(
            candidate => !candidates.some(other => other !== candidate && other.contains(candidate))
        );
    }
}
