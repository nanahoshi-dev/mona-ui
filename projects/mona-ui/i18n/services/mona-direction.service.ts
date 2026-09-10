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
import type { MonaTextDirection } from "../models/mona-direction";

const RTL_CHAR_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const LTR_CHAR_REGEX =
    /[A-Za-z\u00C0-\u024F\u0370-\u052F\u1E00-\u1EFF\u2C00-\u2DDF\uA720-\uA7FF\uAB30-\uAB6F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

export function detectFirstStrongDirection(text: string): MonaTextDirection | null {
    for (const ch of text) {
        if (RTL_CHAR_REGEX.test(ch)) {
            return "rtl";
        }
        if (LTR_CHAR_REGEX.test(ch)) {
            return "ltr";
        }
    }
    return null;
}

export function resolveComponentDirection(
    hostElement?: ElementRef<HTMLElement> | HTMLElement | null,
    directionality?: Directionality | null
): MonaTextDirection {
    const element = hostElement instanceof ElementRef ? hostElement.nativeElement : hostElement;
    if (typeof element?.closest === "function") {
        const closestDir = element.closest("[dir]");
        const rawDir = closestDir?.getAttribute("dir")?.trim().toLowerCase();
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
            if (computedDir === "rtl") {
                return "rtl";
            }
            const firstStrong = detectFirstStrongDirection(closestDir?.textContent ?? "");
            if (firstStrong) {
                return firstStrong;
            }
            if (computedDir === "ltr") {
                return "ltr";
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

export interface DirectionObserverHandle {
    (): void;
    check: () => void;
    updateAutoObserver: () => void;
}

export function observeComponentDirection(
    hostElement: ElementRef<HTMLElement> | HTMLElement | null | undefined,
    directionality: Directionality | null | undefined,
    onChange: (dir: MonaTextDirection) => void
): DirectionObserverHandle {
    const element = hostElement instanceof ElementRef ? hostElement.nativeElement : hostElement;
    let currentDir = resolveComponentDirection(element, directionality);

    let autoContentObserver: MutationObserver | null = null;
    let observedAutoElement: Element | null = null;

    const updateAutoContentObserver = () => {
        if (typeof MutationObserver === "undefined" || !element?.closest) {
            return;
        }
        const closestDir = element.closest("[dir]");
        const isAuto = closestDir?.getAttribute("dir")?.trim().toLowerCase() === "auto";
        if (isAuto && closestDir) {
            if (observedAutoElement !== closestDir) {
                if (autoContentObserver) {
                    autoContentObserver.disconnect();
                }
                observedAutoElement = closestDir;
                autoContentObserver = new MutationObserver(() => {
                    check();
                });
                autoContentObserver.observe(closestDir, {
                    childList: true,
                    characterData: true,
                    subtree: true
                });
            }
        } else {
            if (autoContentObserver) {
                autoContentObserver.disconnect();
                autoContentObserver = null;
                observedAutoElement = null;
            }
        }
    };

    const check = () => {
        updateAutoContentObserver();
        const nextDir = resolveComponentDirection(element, directionality);
        if (nextDir !== currentDir) {
            currentDir = nextDir;
            onChange(nextDir);
        }
    };

    updateAutoContentObserver();

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

    cleanupFns.push(() => {
        if (autoContentObserver) {
            autoContentObserver.disconnect();
            autoContentObserver = null;
            observedAutoElement = null;
        }
    });

    const handle: DirectionObserverHandle = Object.assign(
        () => {
            for (const fn of cleanupFns) {
                fn();
            }
        },
        {
            check,
            updateAutoObserver: updateAutoContentObserver
        }
    );

    return handle;
}

export function injectComponentDirection(hostElementRef?: ElementRef<HTMLElement>): Signal<MonaTextDirection> {
    const directionality = inject(Directionality, { optional: true });
    const hostRef = hostElementRef ?? inject(ElementRef<HTMLElement>, { optional: true });
    const destroyRef = inject(DestroyRef, { optional: true });

    const domVersion = signal<number>(0);
    let updateAutoObserverFn = () => {};

    if (destroyRef) {
        const cleanup = observeComponentDirection(hostRef, directionality, () => {
            domVersion.update(v => v + 1);
        });
        updateAutoObserverFn = cleanup.updateAutoObserver;
        destroyRef.onDestroy(() => cleanup());
    }

    return computed(() => {
        domVersion();
        updateAutoObserverFn();
        return resolveComponentDirection(hostRef, directionality);
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
