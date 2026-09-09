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
        if (rawDir === "auto" && typeof window !== "undefined") {
            const computedDir = window.getComputedStyle(element).direction?.toLowerCase();
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

    if (typeof MutationObserver !== "undefined" && destroyRef) {
        const observer = new MutationObserver(() => {
            domVersion.update(v => v + 1);
        });
        const element = hostRef instanceof ElementRef ? hostRef.nativeElement : hostRef;
        if (element) {
            observer.observe(element, { attributes: true, attributeFilter: ["dir"] });
            if (element.ownerDocument?.documentElement) {
                observer.observe(element.ownerDocument.documentElement, {
                    attributes: true,
                    attributeFilter: ["dir"],
                    subtree: true
                });
            }
        }
        destroyRef.onDestroy(() => observer.disconnect());
    }

    return computed(() => {
        domVersion();
        const element = hostRef instanceof ElementRef ? hostRef.nativeElement : hostRef;
        if (typeof element?.closest === "function") {
            const rawDir = element.closest("[dir]")?.getAttribute("dir")?.trim().toLowerCase();
            if (rawDir === "rtl" || rawDir === "ltr") {
                return rawDir;
            }
            if (rawDir === "auto" && typeof window !== "undefined") {
                const computedDir = window.getComputedStyle(element).direction?.toLowerCase();
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
}
