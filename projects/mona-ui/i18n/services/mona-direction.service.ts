import { Directionality } from "@angular/cdk/bidi";
import {
    afterNextRender,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    Injectable,
    Injector,
    type Signal,
    signal
} from "@angular/core";
import type { MonaTextDirection } from "../models/mona-direction";

/**
 * Reads semantic document direction for a connected browser element using `:dir(rtl)` and `:dir(ltr)`.
 *
 * Mona UI direction-sensitive behaviors follow semantic document directionality
 * (`:dir(...)`, `[dir]`, and CDK Directionality), matching Tailwind's `rtl:`/`ltr:`
 * variant matching. Styling-only CSS `direction` property is not treated as the
 * authoritative Mona direction switch.
 */
function readSemanticDirection(element: Element | null | undefined): MonaTextDirection | null {
    if (!element || !element.isConnected) {
        return null;
    }
    try {
        if (element.matches(":dir(rtl)")) {
            return "rtl";
        }
        if (element.matches(":dir(ltr)")) {
            return "ltr";
        }
    } catch {
        // selector unsupported / environment limitation
    }
    return null;
}

function findNearestValidDirState(element: Element | null | undefined): MonaTextDirection | null {
    let current: Element | null | undefined = element;
    while (current) {
        const rawDir = current.getAttribute?.("dir")?.trim().toLowerCase();
        if (rawDir === "rtl" || rawDir === "ltr") {
            return rawDir;
        }
        if (rawDir === "auto") {
            const semanticDir = readSemanticDirection(current) ?? readSemanticDirection(element);
            if (semanticDir) {
                return semanticDir;
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

    // 1. Connected browser semantic direction (:dir(rtl) / :dir(ltr))
    const semantic = readSemanticDirection(element);
    if (semantic) {
        return semantic;
    }

    // 2. Non-browser / unattached DOM fallback: nearest ancestor explicit dir attribute ("ltr", "rtl", or "auto")
    const explicit = findNearestValidDirState(element);
    if (explicit) {
        return explicit;
    }

    // 3. Angular CDK Directionality fallback
    if (directionality?.value === "rtl" || directionality?.value === "ltr") {
        return directionality.value;
    }

    return "ltr";
}

interface DirectionSubscriber {
    autoRoot: Element | null;
    readonly element: Element;
    readonly invalidate: () => void;
}

interface DirectionRegistry {
    readonly observer: MutationObserver;
    readonly subscribers: Set<DirectionSubscriber>;
}

/**
 * One `dir` attribute observer per observed root (the document element, a shadow root, or the top of a detached
 * tree), shared by every direction-aware instance under it. A mutation only invalidates the instances it can affect,
 * so a `dir` written on an overlay pane does not re-resolve every component on the page.
 */
const directionRegistries = new WeakMap<Node, DirectionRegistry>();

function isShadowRoot(node: Node): node is ShadowRoot {
    return node.nodeType === 11 && "host" in node;
}

function getComposedParent(node: Node): Node | null {
    if (node.parentNode) {
        return node.parentNode;
    }
    return isShadowRoot(node) ? node.host : null;
}

function composedContains(ancestor: Node, node: Node): boolean {
    for (let current: Node | null = node; current; current = getComposedParent(current)) {
        if (current === ancestor) {
            return true;
        }
    }
    return false;
}

/**
 * A `dir` change affects an instance when it lands on the instance's element or one of its ancestors, or anywhere
 * inside the `dir="auto"` root it resolves against (a nested explicit direction changes which text counts).
 */
function isAffectedByDirChange(subscriber: DirectionSubscriber, targets: ReadonlySet<Node>): boolean {
    for (let current: Node | null = subscriber.element; current; current = getComposedParent(current)) {
        if (targets.has(current)) {
            return true;
        }
    }
    const autoRoot = subscriber.autoRoot;
    if (autoRoot) {
        for (const target of targets) {
            if (composedContains(autoRoot, target)) {
                return true;
            }
        }
    }
    return false;
}

function getObservedRoots(element: Element): Node[] {
    const roots: Node[] = [];
    let root = element.getRootNode?.() ?? null;
    while (root && isShadowRoot(root)) {
        roots.push(root);
        root = root.host.getRootNode?.() ?? null;
    }
    // The top of a detached tree, so a host that is not attached yet still sees its own subtree change.
    if (root && root !== element && root.nodeType === 1) {
        roots.push(root);
    }
    const documentElement = element.ownerDocument?.documentElement;
    if (documentElement && !roots.includes(documentElement)) {
        roots.push(documentElement);
    }
    return roots;
}

function registerDirectionSubscriber(observedRoot: Node, subscriber: DirectionSubscriber): () => void {
    let registry = directionRegistries.get(observedRoot);
    if (!registry) {
        const subscribers = new Set<DirectionSubscriber>();
        const observer = new MutationObserver(records => {
            const targets = new Set<Node>();
            for (const record of records) {
                targets.add(record.target);
            }
            for (const candidate of Array.from(subscribers)) {
                if (subscribers.has(candidate) && isAffectedByDirChange(candidate, targets)) {
                    candidate.invalidate();
                }
            }
        });
        observer.observe(observedRoot, { attributes: true, attributeFilter: ["dir"], subtree: true });
        registry = { observer, subscribers };
        directionRegistries.set(observedRoot, registry);
    }

    const activeRegistry = registry;
    activeRegistry.subscribers.add(subscriber);
    return () => {
        activeRegistry.subscribers.delete(subscriber);
        if (activeRegistry.subscribers.size === 0) {
            activeRegistry.observer.disconnect();
            if (directionRegistries.get(observedRoot) === activeRegistry) {
                directionRegistries.delete(observedRoot);
            }
        }
    };
}

interface AutoDirectionObserverEntry {
    readonly callbacks: Set<() => void>;
    lastDirection: MonaTextDirection | null;
    readonly observer: MutationObserver;
    refCount: number;
}

const autoDirectionObservers = new WeakMap<Element, AutoDirectionObserverEntry>();

function observeAutoDirectionChanges(autoRoot: Element, callback: () => void): () => void {
    let entry = autoDirectionObservers.get(autoRoot);
    if (!entry) {
        const callbacks = new Set<() => void>();
        const observer = new MutationObserver(() => {
            const currentDir = readSemanticDirection(autoRoot);
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
            lastDirection: readSemanticDirection(autoRoot)
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

/** The nearest `dir="auto"` ancestor-or-self, unless an explicit `ltr`/`rtl` comes first. */
function findAutoRoot(element: Element): Element | null {
    for (let current: Element | null = element; current; current = current.parentElement) {
        const rawDir = current.getAttribute?.("dir")?.trim().toLowerCase();
        if (rawDir === "auto") {
            return current;
        }
        if (rawDir === "rtl" || rawDir === "ltr") {
            return null;
        }
    }
    return null;
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
    const canObserve = typeof MutationObserver !== "undefined" && !!element;
    let currentDir = resolveComponentDirection(element, directionality);
    let unobserveAuto: (() => void) | null = null;
    const rootSubscriptions = new Map<Node, () => void>();

    const subscriber: DirectionSubscriber | null = element
        ? { autoRoot: null, element, invalidate: () => check() }
        : null;

    const updateAutoContentObserver = () => {
        if (!canObserve || !subscriber) {
            return;
        }
        const autoRoot = findAutoRoot(subscriber.element);
        if (autoRoot === subscriber.autoRoot) {
            return;
        }
        unobserveAuto?.();
        unobserveAuto = autoRoot ? observeAutoDirectionChanges(autoRoot, () => check()) : null;
        subscriber.autoRoot = autoRoot;
    };

    // Re-registers with the roots the host is under now: it may have been created in a detached view and inserted
    // into the document or a shadow root later.
    const syncObservedRoots = () => {
        if (!canObserve || !subscriber) {
            return;
        }
        const roots = getObservedRoots(subscriber.element);
        for (const [root, unsubscribe] of rootSubscriptions) {
            if (!roots.includes(root)) {
                unsubscribe();
                rootSubscriptions.delete(root);
            }
        }
        for (const root of roots) {
            if (!rootSubscriptions.has(root)) {
                rootSubscriptions.set(root, registerDirectionSubscriber(root, subscriber));
            }
        }
    };

    const check = () => {
        syncObservedRoots();
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

    if (canObserve && element) {
        // The host's own dir, which the shared root observers miss while the host is outside them (detached or moved).
        const hostObserver = new MutationObserver(() => check());
        hostObserver.observe(element, { attributes: true, attributeFilter: ["dir"] });
        cleanupFns.push(() => hostObserver.disconnect());
    }

    syncObservedRoots();
    cleanupFns.push(() => {
        for (const unsubscribe of rootSubscriptions.values()) {
            unsubscribe();
        }
        rootSubscriptions.clear();
    });

    cleanupFns.push(() => {
        unobserveAuto?.();
        unobserveAuto = null;
        if (subscriber) {
            subscriber.autoRoot = null;
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

    if (destroyRef) {
        const handle = observeComponentDirection(hostRef, directionality, () => {
            domVersion.update(v => v + 1);
        });
        destroyRef.onDestroy(() => handle());
        // A host can be moved under a different `dir="auto"` root after it is created; re-check once it has rendered.
        afterNextRender(() => handle.check(), { injector: inject(Injector) });
    }

    // Pure: observers are managed by the handle above, never during signal evaluation.
    return computed(() => {
        domVersion();
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
