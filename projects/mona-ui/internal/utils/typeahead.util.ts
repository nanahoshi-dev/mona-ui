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

/**
 * Returns whether a `KeyboardEvent.key` value should feed typeahead.
 * Any single letter or digit in any script counts, plus space, `-` and `_`.
 */
export const isTypeaheadKey = (key: string, modifiers?: TypeaheadModifiers): boolean => {
    if (modifiers?.ctrlKey || modifiers?.metaKey || modifiers?.altKey) {
        return false;
    }
    return /^[\p{L}\p{M}\p{N}\-_\s]$/u.test(key);
};

export const setupTypeahead = (typeaheadKey$: Observable<string>): Observable<string> => {
    const resetTrigger$ = typeaheadKey$.pipe(
        debounceTime(200),
        map(() => ({ type: "reset", value: "" }))
    );
    const keypress$ = typeaheadKey$.pipe(map(key => ({ type: "key", value: key })));
    return merge(keypress$, resetTrigger$).pipe(
        scan((buffer, action) => (action.type === "reset" ? "" : buffer + action.value.toLowerCase()), ""),
        filter(buffer => buffer.length > 0)
    );
};
