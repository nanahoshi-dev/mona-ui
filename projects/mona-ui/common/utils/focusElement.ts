import { ElementRef } from "@angular/core";

export function focusElement(host: HTMLElement, element: HTMLElement | ElementRef<HTMLElement> | string): void {
    if (element instanceof ElementRef) {
        element.nativeElement.focus();
    } else if (element instanceof HTMLElement) {
        element.focus();
    } else {
        const elements = host.querySelectorAll(element);
        if (elements.length > 0) {
            (elements[0] as HTMLElement).focus();
        }
    }
}
