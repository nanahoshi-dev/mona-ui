import { afterNextRender, computed, DestroyRef, Directive, effect, ElementRef, inject, signal, untracked } from "@angular/core";
import { CollapsibleToken } from "../models/CollapsibleConfig";

const CONTENT_HEIGHT_VARIABLE = "--mona-collapsible-content-height";

/**
 * @description
 * Animates the height of the collapsible content between `0` and its measured size. Adds no wrapper
 * element, so it can be applied directly to a `ul`, `div` or any other container with any number of children.
 *
 * The measured size is also published on the host as the `--mona-collapsible-content-height` custom
 * property, so consumers can drive their own animation instead (pair it with `[animate]="false"` on the root).
 */
@Directive({
    selector: "[monaCollapsibleContent]",
    host: {
        "[attr.data-state]": "state()",
        "[attr.id]": "collapsible.contentId",
        "[attr.inert]": "inert()"
    }
})
export class CollapsibleContentDirective {
    readonly #element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #initialized = signal(false);
    readonly #reducedMotion = signal(false);
    #fallbackId: ReturnType<typeof setTimeout> | null = null;
    protected readonly collapsible = inject(CollapsibleToken);
    protected readonly inert = computed(() => (this.collapsible.expanded() ? null : true));
    protected readonly state = computed(() => (this.collapsible.expanded() ? "open" : "closed"));

    public constructor() {
        const destroyRef = inject(DestroyRef);

        if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
            const query = window.matchMedia("(prefers-reduced-motion: reduce)");
            const onPreferenceChange = (event: MediaQueryListEvent): void => this.#reducedMotion.set(event.matches);
            this.#reducedMotion.set(query.matches);
            query.addEventListener("change", onPreferenceChange);
            destroyRef.onDestroy(() => query.removeEventListener("change", onPreferenceChange));
        }

        const onTransitionEnd = (event: TransitionEvent): void => {
            if (event.propertyName !== "height" || event.target !== this.#element) {
                return;
            }
            this.#settle();
        };
        this.#element.addEventListener("transitionend", onTransitionEnd);
        destroyRef.onDestroy(() => {
            this.#element.removeEventListener("transitionend", onTransitionEnd);
            this.#clearFallback();
        });

        afterNextRender(() => {
            this.#settle();
            this.#initialized.set(true);
        });

        effect(() => {
            const expanded = this.collapsible.expanded();
            untracked(() => {
                if (!this.#initialized()) {
                    return;
                }
                this.#animateTo(expanded);
            });
        });
    }

    /** Runs the height transition towards the requested state. */
    #animateTo(expanded: boolean): void {
        this.#clearFallback();
        if (!this.collapsible.animate() || this.#reducedMotion()) {
            this.#settle();
            return;
        }

        const element = this.#element;
        const contentHeight = element.scrollHeight;
        element.style.setProperty(CONTENT_HEIGHT_VARIABLE, `${contentHeight}px`);
        this.#clip();
        this.#setTransitionEnabled(true);

        if (expanded) {
            element.style.height = "0px";
            void element.offsetHeight; // force a reflow so the browser has a start value to animate from
            element.style.height = `${contentHeight}px`;
        } else {
            element.style.height = `${element.offsetHeight}px`;
            void element.offsetHeight;
            element.style.height = "0px";
        }

        this.#scheduleFallback();
    }

    #clearFallback(): void {
        if (this.#fallbackId !== null) {
            clearTimeout(this.#fallbackId);
            this.#fallbackId = null;
        }
    }

    /**
     * Clips the box so an explicit height is actually honoured. `min-height` matters because a flex item
     * defaults to `min-height: auto`, which would otherwise hold the element open at its content height.
     */
    #clip(): void {
        this.#element.style.overflow = "hidden";
        this.#element.style.minHeight = "0px";
    }

    /** Reads the resolved transition duration in milliseconds, which comes from a theme custom property. */
    #getTransitionDuration(): number {
        const declared = getComputedStyle(this.#element).transitionDuration;
        const durations = declared.split(",").map(part => {
            const trimmed = part.trim();
            const parsed = Number.parseFloat(trimmed);
            if (!Number.isFinite(parsed)) {
                return 0;
            }
            return trimmed.endsWith("ms") ? parsed : parsed * 1000;
        });
        return Math.max(0, ...durations);
    }

    /** Guards against a `transitionend` that never arrives, e.g. when an ancestor hides the element mid-flight. */
    #scheduleFallback(): void {
        this.#fallbackId = setTimeout(() => this.#settle(), this.#getTransitionDuration() + 50);
    }

    #setTransitionEnabled(enabled: boolean): void {
        const style = this.#element.style;
        if (!enabled) {
            style.transitionProperty = "";
            style.transitionDuration = "";
            style.transitionTimingFunction = "";
            return;
        }
        style.transitionProperty = "height";
        style.transitionDuration = `var(--mona-motion-standard, 300ms)`;
        style.transitionTimingFunction = "ease-out";
    }

    /** Drops the transition and pins the element to the resting representation of the current state. */
    #settle(): void {
        this.#clearFallback();
        this.#setTransitionEnabled(false);

        const element = this.#element;
        if (this.collapsible.expanded()) {
            element.style.height = "";
            element.style.overflow = "";
            element.style.minHeight = "";
        } else {
            element.style.height = "0px";
            this.#clip();
        }
        element.style.setProperty(CONTENT_HEIGHT_VARIABLE, `${element.scrollHeight}px`);
    }
}
