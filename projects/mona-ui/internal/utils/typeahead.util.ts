import { debounceTime, filter, map, merge, Observable, scan } from "rxjs";

/**
 * Modifier state of a keyboard event. Typeahead is skipped while Ctrl, Meta or Alt is held,
 * so shortcuts such as Ctrl+A or Cmd+C keep their default behavior.
 */
export interface TypeaheadModifiers {
    readonly altKey?: boolean;
    readonly ctrlKey?: boolean;
    readonly metaKey?: boolean;
}

/** Text without control, format or unassigned characters: what a key that types something gives. */
const PRINTABLE_TEXT = /^\P{C}+$/u;

/** The names of keys that type nothing, such as "Enter", "F2" or "Dead". Typed text is never a name like these. */
const KEY_NAME = /^[A-Za-z][A-Za-z0-9]+$/;

/**
 * Returns whether a `KeyboardEvent.key` value should feed typeahead: any key that types something, in any script,
 * so names such as ".config", "(old)" or "~$draft.docx" can be typed out. Named keys such as Enter don't.
 */
export const isTypeaheadKey = (key: string, modifiers?: TypeaheadModifiers): boolean => {
    if (modifiers?.ctrlKey || modifiers?.metaKey || modifiers?.altKey) {
        return false;
    }
    return PRINTABLE_TEXT.test(key) && !KEY_NAME.test(key);
};

/**
 * How long typeahead waits after the last key before it starts a new search, in milliseconds: about as long as the
 * lists of Windows and the `<select>` of browsers wait, so a name can be typed out at an ordinary pace.
 */
export const TYPEAHEAD_RESET_DELAY = 1000;

/**
 * Collects the keys typed into a search buffer, in lower case, which starts again once no key comes for
 * `TYPEAHEAD_RESET_DELAY`. An empty string starts it again at once, as a key that moves the active item should.
 * @returns The buffer after each key typed.
 */
export const setupTypeahead = (typeaheadKey$: Observable<string>): Observable<string> => {
    const resetTrigger$ = typeaheadKey$.pipe(
        debounceTime(TYPEAHEAD_RESET_DELAY),
        map(() => ({ type: "reset", value: "" }))
    );
    const keypress$ = typeaheadKey$.pipe(map(key => ({ type: "key", value: key })));
    return merge(keypress$, resetTrigger$).pipe(
        scan(
            (buffer, action) =>
                action.type === "reset" || action.value === "" ? "" : buffer + action.value.toLowerCase(),
            ""
        ),
        filter(buffer => buffer.length > 0)
    );
};

/**
 * Finds the item typeahead moves to, as the lists of Windows do:
 * - One character moves on to the next item after the active one whose text starts with it.
 * - More characters search from the active item on, so it stays active while its text still matches.
 * - The same character typed again, as in "aa", moves on to the next item whose text starts with what was typed or,
 *   when no other item's does, with that character: repeating a letter steps through the items that start with it.
 *
 * The search ignores case and wraps around.
 * @param buffer What was typed, as `setupTypeahead` gives it.
 * @param count How many items there are.
 * @param activeIndex The active item's index, or -1 when there is none.
 * @param textAt The text of the item at an index, or `null` for an item typeahead skips, such as a disabled one.
 * @returns The index of the item to move to, or -1 when none matches.
 */
export const findTypeaheadMatch = (
    buffer: string,
    count: number,
    activeIndex: number,
    textAt: (index: number) => string | null
): number => {
    const prefix = buffer.toLowerCase();
    if (prefix === "" || count <= 0) {
        return -1;
    }
    const active = activeIndex >= 0 && activeIndex < count ? activeIndex : -1;
    const matches = (index: number, text: string): boolean => textAt(index)?.toLowerCase().startsWith(text) === true;
    const search = (text: string, start: number, steps: number): number => {
        for (let step = 0; step < steps; step++) {
            const index = (start + step) % count;
            if (matches(index, text)) {
                return index;
            }
        }
        return -1;
    };
    const characters = Array.from(prefix);
    if (characters.length === 1) {
        return search(prefix, active + 1, count);
    }
    if (characters.every(character => character === characters[0])) {
        // The other items, from the one after the active item on; then the letter alone, the active item last.
        const repeated = search(prefix, active + 1, active < 0 ? count : count - 1);
        return repeated >= 0 ? repeated : search(characters[0], active + 1, count);
    }
    return search(prefix, Math.max(active, 0), count);
};
