import { debounceTime, filter, map, merge, Observable, scan } from "rxjs";

export const isTypeaheadKey = (key: string): boolean => {
    return /^[a-zA-Z0-9\-_\s]$/.test(key);
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
