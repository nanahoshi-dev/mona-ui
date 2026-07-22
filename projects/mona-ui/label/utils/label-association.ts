import type { LabelTarget } from "../models/LabelTarget";

export function getLabelForAttribute(target: LabelTarget): string | null {
    return typeof target === "string" ? target : null;
}

export function focusLabelTarget(target: LabelTarget, event: MouseEvent): void {
    if (event.defaultPrevented || target === null || target === undefined || typeof target === "string") {
        return;
    }

    target.focus();
}
