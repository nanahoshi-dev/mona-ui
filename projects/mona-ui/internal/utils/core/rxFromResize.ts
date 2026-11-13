import { Observable } from "rxjs";

// A plain loop rather than ts-collections, where any one function brings some 100 kB: the internal entry point, which
// the button and nearly every component import, would otherwise bring all of that.
export const rxFromResize = (
    target: Element | Iterable<Element>,
    options?: ResizeObserverOptions
): Observable<ResizeObserverEntry[]> => {
    return new Observable(observer => {
        const elements = target instanceof Element ? [target] : Array.from(target ?? []);
        for (const element of elements) {
            if (!(element instanceof Element)) {
                observer.error(new TypeError("target must be an Element or an iterable of Elements"));
                return;
            }
        }
        const resizeObserver = new ResizeObserver(entries => observer.next(entries));
        for (const element of elements) {
            resizeObserver.observe(element, options);
        }
        return () => resizeObserver.disconnect();
    });
};
