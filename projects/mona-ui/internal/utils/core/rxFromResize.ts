import { Observable } from "rxjs";

// A plain loop: the internal entry point, which the button and nearly every component import, doesn't import
// ts-collections, where a class or any function that returns a sequence brings some 100 kB.
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
