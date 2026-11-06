import { effect } from "@angular/core";
import type { LabelTarget } from "../models/LabelTarget";

export function getLabelForAttribute(target: LabelTarget): string | null {
    return typeof target === "string" ? target : null;
}

export function focusLabelTarget(target: LabelTarget, event: MouseEvent): void {
    if (event.defaultPrevented || target === null || target === undefined || typeof target === "string") {
        return;
    }

    if (target.activateFromLabel) {
        target.activateFromLabel();
    } else {
        target.focus();
    }
}

/**
 * Tells a control bound through `[for]` which element names it.
 */
export function linkLabelTarget(target: () => LabelTarget, labelId: () => string): void {
    effect(onCleanup => {
        const current = target();
        if (current === null || current === undefined || typeof current === "string" || !current.setLabelledBy) {
            return;
        }
        current.setLabelledBy(labelId());
        onCleanup(() => current.setLabelledBy?.(null));
    });
}

/**
 * Warns when a string `for` points at an element a label can't control, such as the host of a mona-switch. The browser
 * says nothing about this, and the control stays unnamed.
 */
export function warnIfTargetNotLabelable(target: LabelTarget, label: HTMLLabelElement): void {
    if (typeof target !== "string" || label.control || !label.ownerDocument.getElementById(target)) {
        return;
    }
    console.warn(
        `[Mona Label] for="${target}" points at an element a label can't control. Bind the component instead, as ` +
            `[for]="ref", or use the control's inputId.`,
        label
    );
}
