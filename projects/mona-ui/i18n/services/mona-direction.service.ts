import { Directionality } from "@angular/cdk/bidi";
import {
    computed,
    DestroyRef,
    ElementRef,
    inject,
    Injectable,
    type Signal,
    signal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { MonaTextDirection } from "../models/mona-direction";

export function resolveComponentDirection(
    hostElement?: ElementRef<HTMLElement> | HTMLElement | null,
    directionality?: Directionality | null
): MonaTextDirection {
    const element = hostElement instanceof ElementRef ? hostElement.nativeElement : hostElement;
    if (typeof element?.closest === "function") {
        const rawDir = element.closest("[dir]")?.getAttribute("dir")?.trim().toLowerCase();
        if (rawDir === "rtl" || rawDir === "ltr") {
            return rawDir;
        }
        if (rawDir === "auto") {
            const defaultView = element.ownerDocument?.defaultView;
            const computedDir = defaultView
                ? defaultView.getComputedStyle(element).direction?.toLowerCase()
                : typeof window !== "undefined"
                  ? window.getComputedStyle(element).direction?.toLowerCase()
                  : undefined;
            if (computedDir === "rtl" || computedDir === "ltr") {
                return computedDir;
            }
        }
    }
    if (directionality?.value === "rtl" || directionality?.value === "ltr") {
        return directionality.value;
    }
    return "ltr";
}

interface DocumentObserverEntry {
    refCount: number;
    readonly observer: MutationObserver;
    readonly callbacks: Set<() => void>;
}

const documentObservers = new WeakMap<Document, DocumentObserverEntry>();

function observeDocumentDirChanges(doc: Document, callback: () => void): () => void {
    let entry = documentObservers.get(doc);
    if (!entry) {
        const callbacks = new Set<() => void>();
        const observer = new MutationObserver(() => {
            for (const cb of Array.from(callbacks)) {
                cb();
            }
        });
        if (doc.documentElement) {
            observer.observe(doc.documentElement, {
                attributes: true,
                attributeFilter: ["dir"],
                subtree: true
            });
        }
        entry = { refCount: 0, observer, callbacks };
        documentObservers.set(doc, entry);
    }

    entry.refCount++;
    entry.callbacks.add(callback);

    let cleanedUp = false;
    return () => {
        if (cleanedUp || !entry) {
            return;
        }
        cleanedUp = true;
        entry.callbacks.delete(callback);
        entry.refCount--;
        if (entry.refCount <= 0) {
            entry.observer.disconnect();
            documentObservers.delete(doc);
        }
    };
}

export function observeComponentDirection(
    hostElement: ElementRef<HTMLElement> | HTMLElement | null | undefined,
    directionality: Directionality | null | undefined,
    onChange: (dir: MonaTextDirection) => void
): () => void {
    const element = hostElement instanceof ElementRef ? hostElement.nativeElement : hostElement;
    let currentDir = resolveComponentDirection(element, directionality);

    const check = () => {
        const nextDir = resolveComponentDirection(element, directionality);
        if (nextDir !== currentDir) {
            currentDir = nextDir;
            onChange(nextDir);
        }
    };

    const cleanupFns: Array<() => void> = [];

    if (directionality) {
        const sub = directionality.change.subscribe(dir => {
            if (dir === "rtl" || dir === "ltr") {
                check();
            }
        });
        cleanupFns.push(() => sub.unsubscribe());
    }

    if (typeof MutationObserver !== "undefined") {
        if (element) {
            const elObserver = new MutationObserver(() => check());
            elObserver.observe(element, { attributes: true, attributeFilter: ["dir"] });
            cleanupFns.push(() => elObserver.disconnect());

            if (element.ownerDocument) {
                cleanupFns.push(observeDocumentDirChanges(element.ownerDocument, check));
            }
        }
    }

    return () => {
        for (const fn of cleanupFns) {
            fn();
        }
    };
}

export function injectComponentDirection(hostElementRef?: ElementRef<HTMLElement>): Signal<MonaTextDirection> {
    const directionality = inject(Directionality, { optional: true });
    const hostRef = hostElementRef ?? inject(ElementRef<HTMLElement>, { optional: true });
    const destroyRef = inject(DestroyRef, { optional: true });

    const cdkDir = signal<MonaTextDirection>(
        directionality?.value === "rtl" || directionality?.value === "ltr"
            ? directionality.value
            : "ltr"
    );

    const domVersion = signal<number>(0);

    if (directionality && destroyRef) {
        directionality.change
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe(dir => {
                if (dir === "rtl" || dir === "ltr") {
                    cdkDir.set(dir);
                }
            });
    }

    if (destroyRef) {
        const cleanup = observeComponentDirection(hostRef, directionality, () => {
            domVersion.update(v => v + 1);
        });
        destroyRef.onDestroy(() => cleanup());
    }

    return computed(() => {
        domVersion();
        const element = hostRef instanceof ElementRef ? hostRef.nativeElement : hostRef;
        if (typeof element?.closest === "function") {
            const rawDir = element.closest("[dir]")?.getAttribute("dir")?.trim().toLowerCase();
            if (rawDir === "rtl" || rawDir === "ltr") {
                return rawDir;
            }
            if (rawDir === "auto") {
                const defaultView = element.ownerDocument?.defaultView;
                const computedDir = defaultView
                    ? defaultView.getComputedStyle(element).direction?.toLowerCase()
                    : typeof window !== "undefined"
                      ? window.getComputedStyle(element).direction?.toLowerCase()
                      : undefined;
                if (computedDir === "rtl" || computedDir === "ltr") {
                    return computedDir;
                }
            }
        }
        return cdkDir();
    });
}

@Injectable({
    providedIn: "root"
})
export class MonaDirectionService {
    readonly #directionality = inject(Directionality, { optional: true });

    public getDirection(element?: ElementRef<HTMLElement> | HTMLElement | null): MonaTextDirection {
        return resolveComponentDirection(element, this.#directionality);
    }

    public isRtl(element?: ElementRef<HTMLElement> | HTMLElement | null): boolean {
        return this.getDirection(element) === "rtl";
    }

    public observeDirection(
        element: ElementRef<HTMLElement> | HTMLElement | null | undefined,
        onChange: (dir: MonaTextDirection) => void
    ): () => void {
        return observeComponentDirection(element, this.#directionality, onChange);
    }
}
