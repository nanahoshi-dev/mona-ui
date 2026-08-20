import { createSvgElement } from "./svg-element-utils";

export interface SvgReconcileOptions<T, E extends SVGElement = SVGElement> {
    readonly create?: (item: T, index: number) => E;
    readonly key: (item: T, index: number) => string;
    readonly tag?: string | ((item: T, index: number) => string);
    readonly update: (element: E, item: T, index: number) => void;
}

export class SvgKeyedGroup<T = unknown, E extends SVGElement = SVGElement> {
    #container: SVGGElement | null;
    #elementsByKey = new Map<string, E>();

    public constructor(container: SVGGElement) {
        this.#container = container;
    }

    public get container(): SVGGElement | null {
        return this.#container;
    }

    public get size(): number {
        return this.#elementsByKey.size;
    }

    public get(key: string): E | undefined {
        return this.#elementsByKey.get(key);
    }

    public reconcile(items: readonly T[], options: SvgReconcileOptions<T, E>): void {
        const container = this.#container;
        if (!container) {
            return;
        }

        const keyOccurrences = new Map<string, number>();
        const seenKeys = new Set<string>();
        const nextElements = new Map<string, E>();
        let currentChild = container.firstElementChild as SVGElement | null;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rawKey = options.key(item, i);
            const count = keyOccurrences.get(rawKey) ?? 0;
            keyOccurrences.set(rawKey, count + 1);
            const key = count === 0 ? rawKey : `${rawKey}__dup_${count}`;

            seenKeys.add(key);

            let element = this.#elementsByKey.get(key);
            if (!element) {
                if (options.create) {
                    element = options.create(item, i);
                } else {
                    const tag = typeof options.tag === "function" ? options.tag(item, i) : (options.tag ?? "g");
                    element = createSvgElement<E>(tag as keyof SVGElementTagNameMap);
                }
                element.setAttribute("data-key", key);
            }

            options.update(element, item, i);
            nextElements.set(key, element);

            // Reorder in DOM if needed
            if (currentChild !== element) {
                container.insertBefore(element, currentChild);
            } else {
                currentChild = currentChild.nextElementSibling as SVGElement | null;
            }
        }

        // Remove stale nodes
        for (const [key, element] of this.#elementsByKey.entries()) {
            if (!seenKeys.has(key)) {
                element.remove();
            }
        }

        this.#elementsByKey = nextElements;
    }

    public clear(): void {
        for (const element of this.#elementsByKey.values()) {
            element.remove();
        }
        this.#elementsByKey.clear();
    }

    public destroy(): void {
        this.clear();
        this.#container = null;
    }
}
