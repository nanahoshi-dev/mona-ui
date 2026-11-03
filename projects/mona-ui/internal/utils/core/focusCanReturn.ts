/**
 * Whether a closing popup may move focus back to its trigger without taking it from somewhere the user put it.
 * That holds while focus is on the page itself or inside one of `containers`, usually the trigger and the popup.
 * A click on another field that closed the popup, or a Tab out of it, must leave focus where it went.
 * This is the rule the CDK dialog uses.
 */
export function focusCanReturn(document: Document, ...containers: ReadonlyArray<Element | null | undefined>): boolean {
    const activeElement = document.activeElement;
    if (activeElement == null || activeElement === document.body) {
        return true;
    }
    return containers.some(container => container?.contains(activeElement));
}
