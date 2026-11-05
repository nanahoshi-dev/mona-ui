import { ElementRef } from "@angular/core";

/**
 * Focuses an element given directly, by reference, or by a selector inside `host`, and returns it (or `null` when the
 * selector matches nothing).
 */
export function focusElement(
    host: HTMLElement,
    element: HTMLElement | ElementRef<HTMLElement> | string
): HTMLElement | null {
    const target =
        element instanceof ElementRef
            ? element.nativeElement
            : element instanceof HTMLElement
              ? element
              : host.querySelector<HTMLElement>(element);
    target?.focus();
    return target;
}
