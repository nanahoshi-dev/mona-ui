import { forEach } from "@mirei/ts-collections";
import { Observable } from "rxjs";

export const rxFromResize = (
    target: Element | Iterable<Element>,
    options?: ResizeObserverOptions
): Observable<ResizeObserverEntry[]> => {
    return new Observable(observer => {
        const elements = Array.isArray(target) ? target : [target];
        for (const element of elements) {
            if (!(element instanceof Element)) {
                observer.error(new TypeError("target must be an Element or an iterable of Elements"));
                return;
            }
        }
        const resizeObserver = new ResizeObserver(entries => observer.next(entries));
        forEach(elements, e => resizeObserver.observe(e, options));
        return () => resizeObserver.disconnect();
    });
};
