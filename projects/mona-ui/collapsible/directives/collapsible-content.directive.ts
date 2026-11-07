import { afterNextRender, computed, DestroyRef, Directive, effect, ElementRef, inject, input, signal, untracked } from "@angular/core";
import { COLLAPSIBLE_CONFIG } from "../models/CollapsibleConfig";

const CONTENT_HEIGHT_VARIABLE = "--mona-collapsible-content-height";

/** A box can't get below its padding and border, so a height of 0 needs these at 0 as well. */
const BOX_PROPERTIES = [
    "padding-block-start",
    "padding-block-end",
    "border-block-start-width",
    "border-block-end-width"
] as const;

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
    protected readonly collapsible = inject(COLLAPSIBLE_CONFIG);
    protected readonly inert = computed(() => (this.collapsible.expanded() ? null : true));
    protected readonly state = computed(() => (this.collapsible.expanded() ? "open" : "closed"));

    /**
     * @description The content's id, for when it has to be something in particular. Generated if not given.
     */
    public readonly id = input<string | null>(null);

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
                    // This also runs on the server, so collapsed content isn't sent out open.
                    this.#settle();
                    return;
                }
                this.#animateTo(expanded);
            });
        });

        effect(() => {
            const id = this.id();
            untracked(() => this.collapsible.setContentId?.(id));
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
        const computed = getComputedStyle(element);
        // Not the resting shape: a toggle mid-animation carries on from where it got to.
        const startHeight = element.offsetHeight;
        const startBox = BOX_PROPERTIES.map(property => computed.getPropertyValue(property));

        this.#setTransitionEnabled(false);
        const contentHeight = this.#measure();
        element.style.setProperty(CONTENT_HEIGHT_VARIABLE, `${contentHeight}px`);
        this.#clip();

        element.style.height = `${startHeight}px`;
        BOX_PROPERTIES.forEach((property, index) => element.style.setProperty(property, startBox[index]));
        void element.offsetHeight; // force a reflow so the browser has a start value to animate from

        this.#setTransitionEnabled(true);
        this.#rest(expanded);
        if (expanded) {
            element.style.height = `${contentHeight}px`;
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
            // Only a resolved time counts. Where nothing resolves `var()`, as in jsdom, its fallback isn't one.
            const match = /^([\d.]+)(ms|s)$/.exec(part.trim());
            if (!match) {
                return 0;
            }
            return match[2] === "ms" ? Number(match[1]) : Number(match[1]) * 1000;
        });
        return Math.max(0, ...durations);
    }

    /**
     * Measures the element open, since closed it has no padding or border to count. The height stays as it is:
     * `scrollHeight` counts clipped content, and laying the element out open would be where a transition of the
     * consumer's own starts from.
     */
    #measure(): number {
        for (const property of BOX_PROPERTIES) {
            this.#element.style.removeProperty(property);
        }
        // No layout on the server, where this also runs, and perhaps no `getComputedStyle` either.
        if (typeof getComputedStyle !== "function") {
            return 0;
        }
        const computed = getComputedStyle(this.#element);
        const border = BOX_PROPERTIES.slice(2).map(property => parseFloat(computed.getPropertyValue(property)) || 0);
        return this.#element.scrollHeight + border[0] + border[1] || 0;
    }

    /** Sets what makes the element open or closed. */
    #rest(expanded: boolean): void {
        const { style } = this.#element;
        style.height = expanded ? "" : "0px";
        for (const property of BOX_PROPERTIES) {
            if (expanded) {
                style.removeProperty(property);
            } else {
                style.setProperty(property, "0px");
            }
        }
    }

    /** Guards against a `transitionend` that never arrives, e.g. when an ancestor hides the element mid-flight. */
    #scheduleFallback(): void {
        this.#fallbackId = setTimeout(() => this.#settle(), this.#getTransitionDuration() + 50);
    }

    #setTransitionEnabled(enabled: boolean): void {
        const style = this.#element.style;
        if (!enabled) {
            // Just clearing it would leave what's running to finish, since the property's initial value is `all`.
            style.transitionProperty = "none";
            void this.#element.offsetHeight;
            style.transitionProperty = "";
            style.transitionDuration = "";
            style.transitionTimingFunction = "";
            return;
        }
        style.transitionProperty = ["height", ...BOX_PROPERTIES].join(", ");
        style.transitionDuration = `var(--mona-motion-standard, 300ms)`;
        style.transitionTimingFunction = "ease-out";
    }

    /** Drops the transition and pins the element to the resting representation of the current state. */
    #settle(): void {
        this.#clearFallback();
        this.#setTransitionEnabled(false);

        const element = this.#element;
        const contentHeight = this.#measure();
        if (this.collapsible.expanded()) {
            this.#rest(true);
            element.style.overflow = "";
            element.style.minHeight = "";
        } else {
            this.#rest(false);
            this.#clip();
        }
        element.style.setProperty(CONTENT_HEIGHT_VARIABLE, `${contentHeight}px`);
    }
}
