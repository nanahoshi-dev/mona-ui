import { afterEveryRender, DOCUMENT, inject, type Signal, signal, untracked } from "@angular/core";

/**
 * The text of the elements an `aria-labelledby` value points to, joined with spaces, for names built from a
 * component's name ("Filter {name}"). It's read after every render, so it follows the labelling elements' text.
 * Call it in an injection context.
 * @param ids Returns the space-separated element ids.
 */
export function injectLabelledByText(ids: () => string): Signal<string> {
    const document = inject(DOCUMENT);
    const text = signal("");
    afterEveryRender({
        read: () => {
            const value = ids()
                .split(/\s+/)
                .filter(id => id.length > 0)
                .map(id => document.getElementById(id)?.textContent?.replace(/\s+/g, " ").trim() ?? "")
                .filter(part => part.length > 0)
                .join(" ");
            if (value !== untracked(text)) {
                text.set(value);
            }
        }
    });
    return text.asReadonly();
}
