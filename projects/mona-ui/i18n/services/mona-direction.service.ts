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

/**
 * Reads the platform-resolved CSS `direction` for an element.
 *
 * Browsers implement the HTML auto-directionality algorithm in full, including Unicode bidi
 * classification of the first strong character (L/AL/R only) and the exclusion rules for nested
 * explicit-direction subtrees, `bdi`, `script`, `style`, and `textarea`. Mona therefore delegates
 * `dir="auto"` resolution to the platform instead of reimplementing a partial Unicode-range heuristic
 * that can contradict CSS and `:dir(...)`.
 */
function readComputedDirection(element: Element | null | undefined): MonaTextDirection | null {
    if (!element) {
        return null;
    }
    const view = element.ownerDocument?.defaultView ?? (typeof window !== "undefined" ? window : undefined);
    if (!view || typeof view.getComputedStyle !== "function") {
        return null;
    }
    try {
        const direction = view.getComputedStyle(element).direction?.trim().toLowerCase();
        return direction === "rtl" || direction === "ltr" ? direction : null;
    } catch {
        return null;
    }
}

function findNearestValidDirState(element: Element | null | undefined): MonaTextDirection | null {
    let current: Element | null | undefined = element;
    while (current) {
        const rawDir = current.getAttribute?.("dir")?.trim().toLowerCase();
        if (rawDir === "rtl" || rawDir === "ltr") {
            return rawDir;
        }
        if (rawDir === "auto") {
            const computedDir = readComputedDirection(current) ?? readComputedDirection(element);
            if (computedDir) {
                return computedDir;
            }
        }
        current = current.parentElement;
    }
    return null;
}

export function resolveComponentDirection(
    hostElement?: ElementRef<HTMLElement> | HTMLElement | null,
    directionality?: Directionality | null
): MonaTextDirection {
    const element = hostElement instanceof ElementRef ? hostElement.nativeElement : hostElement;

    // 1. Ancestor explicit dir attribute ("ltr", "rtl", or "auto")
    const explicit = findNearestValidDirState(element);
    if (explicit) {
        return explicit;
    }

    // 2. Angular CDK Directionality
    if (directionality?.value === "rtl" || directionality?.value === "ltr") {
        return directionality.value;
    }

    // 3. Computed CSS direction (e.g. style="direction: rtl" or platform inherited direction)
    const computed = readComputedDirection(element);
    if (computed) {
        return computed;
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

interface AutoDirectionObserverEntry {
    refCount: number;
    readonly observer: MutationObserver;
    readonly callbacks: Set<() => void>;
    lastDirection: MonaTextDirection | null;
}

const autoDirectionObservers = new WeakMap<Element, AutoDirectionObserverEntry>();

function observeAutoDirectionChanges(autoRoot: Element, callback: () => void): () => void {
    let entry = autoDirectionObservers.get(autoRoot);
    if (!entry) {
        const callbacks = new Set<() => void>();
        const observer = new MutationObserver(() => {
            const currentDir = readComputedDirection(autoRoot);
            if (entry && (entry.lastDirection === null || currentDir !== entry.lastDirection)) {
                entry.lastDirection = currentDir;
                for (const cb of Array.from(callbacks)) {
                    cb();
                }
            }
        });
        observer.observe(autoRoot, {
            childList: true,
            characterData: true,
            subtree: true
        });
        entry = {
            refCount: 0,
            observer,
            callbacks,
            lastDirection: readComputedDirection(autoRoot)
        };
        autoDirectionObservers.set(autoRoot, entry);
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
            autoDirectionObservers.delete(autoRoot);
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

    let unobserveAuto: (() => void) | null = null;
    let observedAutoElement: Element | null = null;

    const updateAutoContentObserver = () => {
        if (typeof MutationObserver === "undefined" || !element) {
            return;
        }
        let autoRoot: Element | null = null;
        let current: Element | null = element;
        while (current) {
            const rawDir = current.getAttribute?.("dir")?.trim().toLowerCase();
            if (rawDir === "auto") {
                autoRoot = current;
                break;
            }
            if (rawDir === "rtl" || rawDir === "ltr") {
                break;
            }
            current = current.parentElement;
        }

        if (autoRoot) {
            if (observedAutoElement !== autoRoot) {
                if (unobserveAuto) {
                    unobserveAuto();
                }
                observedAutoElement = autoRoot;
                unobserveAuto = observeAutoDirectionChanges(autoRoot, () => check());
            }
        } else {
            if (unobserveAuto) {
                unobserveAuto();
                unobserveAuto = null;
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
        if (unobserveAuto) {
            unobserveAuto();
            unobserveAuto = null;
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
