import { isPlatformBrowser } from "@angular/common";
import {
    booleanAttribute,
    DestroyRef,
    Directive,
    DOCUMENT,
    ElementRef,
    inject,
    input,
    NgZone,
    PLATFORM_ID,
    type Signal,
    signal
} from "@angular/core";
import { rippleContainerClasses, rippleWaveClasses } from "../styles/ripple.styles";
import { RIPPLE_OPTIONS } from "../tokens/ripple.tokens";
import { parseCssTime } from "../utils/parse-css-time";

/**
 * Used when nothing sets `--mona-ripple-duration`. The theme's motion tokens are for menus and popups, which should be
 * brisk, and over those the wave read as a flash rather than a ripple.
 */
const FALLBACK_SPREAD_DURATION = 450;
/** Used when nothing sets `--mona-ripple-fade-duration`. */
const FALLBACK_FADE_DURATION = 300;
/**
 * Moving at once, so that a press shows straight away, and slowing down from there. It is a third of the way out
 * after 50ms of the default duration, and nine tenths after 270ms.
 */
const SPREAD_EASING = "cubic-bezier(0, 0, 0.2, 1)";
const RELEASE_EVENTS = ["pointercancel", "pointerleave", "pointerup"] as const;
/**
 * Controls of their own. A press on one inside the element, such as a chip's remove button or a button in a list item,
 * belongs to that control, so the element draws no ripple for it.
 */
const NESTED_CONTROL_SELECTOR =
    "a[href], button, input, select, textarea, [contenteditable='true'], [role='button'], [role='link']";

interface RippleDurations {
    readonly fade: number;
    readonly spread: number;
}

/**
 * @description
 * Draws a ripple when the element is pressed: a wave in its text color that spreads from the pointer, stays while the
 * element is held and fades once it is let go. Mona UI's buttons apply it themselves. It draws nothing until ripples
 * are turned on with `provideRipple()`.
 *
 * The wave covers the element's padding box, over its background and under its content. For that, the first press
 * gives the element `isolation: isolate`, and makes it `relative` if its position is `static`. The wave spreads over
 * `--mona-ripple-duration`, 450ms unless set, fades over `--mona-ripple-fade-duration`, 300ms unless set, and its
 * opacity is `--mona-ripple-opacity`, 12% unless set.
 *
 * There is no ripple on a disabled or `aria-disabled` element, with the system's reduced motion setting, or in forced
 * colors. Keyboard presses have none either: the focus indicator already shows where they act. Nor does a press on a
 * control inside the element, such as a button or a link, which belongs to that control.
 */
@Directive({
    selector: "[monaRipple]"
})
export class RippleDirective {
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #options = inject(RIPPLE_OPTIONS);
    #container: HTMLSpanElement | null = null;
    #hostDisabled: Signal<boolean> = signal(false);

    /**
     * @description Turns the ripple off for this element while ripples are on.
     * @default false
     */
    public readonly disabled = input(false, { alias: "monaRippleDisabled", transform: booleanAttribute });

    public constructor() {
        if (!this.#options.enabled || !isPlatformBrowser(inject(PLATFORM_ID))) {
            return;
        }
        // Listening straight away, rather than after the first render, costs a long list nothing per item.
        const host = this.#hostElementRef.nativeElement;
        const listener = (event: PointerEvent): void => this.#launch(event);
        // A press changes nothing Angular renders, so it shouldn't start change detection in a zone.js app.
        inject(NgZone).runOutsideAngular(() => host.addEventListener("pointerdown", listener, { passive: true }));
        inject(DestroyRef).onDestroy(() => host.removeEventListener("pointerdown", listener));
    }

    /**
     * Lets a component that applies this directive as a host directive turn the ripple off, such as a button whose look
     * has no surface to draw it on.
     * @hidden Used by Mona UI's own components.
     */
    public setHostDisabled(disabled: Signal<boolean>): void {
        this.#hostDisabled = disabled;
    }

    #canDraw(host: HTMLElement, event: PointerEvent): boolean {
        if (this.disabled() || this.#hostDisabled() || host.matches(":disabled, [aria-disabled='true']")) {
            return false;
        }
        const control = event.target instanceof Element ? event.target.closest(NESTED_CONTROL_SELECTOR) : null;
        if (control && control !== host && host.contains(control)) {
            return false;
        }
        // Not every environment has the Web Animations API, jsdom among them.
        if (typeof host.animate !== "function") {
            return false;
        }
        const view = this.#document.defaultView;
        if (typeof view?.matchMedia !== "function") {
            return true;
        }
        return (
            !view.matchMedia("(prefers-reduced-motion: reduce)").matches &&
            !view.matchMedia("(forced-colors: active)").matches
        );
    }

    #durations(host: HTMLElement): RippleDurations {
        const style = this.#document.defaultView?.getComputedStyle(host);
        return {
            fade: parseCssTime(style?.getPropertyValue("--mona-ripple-fade-duration") ?? "", FALLBACK_FADE_DURATION),
            spread: parseCssTime(style?.getPropertyValue("--mona-ripple-duration") ?? "", FALLBACK_SPREAD_DURATION)
        };
    }

    #ensureContainer(host: HTMLElement): HTMLSpanElement {
        if (this.#container && this.#container.parentNode === host) {
            return this.#container;
        }
        const style = this.#document.defaultView?.getComputedStyle(host);
        if (style?.position === "static") {
            host.style.position = "relative";
        }
        if (style?.isolation !== "isolate") {
            host.style.isolation = "isolate";
        }
        const container = this.#document.createElement("span");
        container.className = rippleContainerClasses;
        container.setAttribute("aria-hidden", "true");
        // A wave is placed by the pointer's physical position, so its layer is laid out left to right in every
        // direction.
        container.dir = "ltr";
        host.append(container);
        this.#container = container;
        return container;
    }

    #launch(event: PointerEvent): void {
        const host = this.#hostElementRef.nativeElement;
        if (event.button !== 0 || !this.#canDraw(host, event)) {
            return;
        }
        const container = this.#ensureContainer(host);
        const bounds = container.getBoundingClientRect();
        const x = event.clientX - bounds.x;
        const y = event.clientY - bounds.y;
        // The wave reaches the corner farthest from the pointer, so that it covers the element once it has spread.
        const radius = Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y));
        const wave = this.#document.createElement("span");
        wave.className = rippleWaveClasses;
        wave.style.width = `${radius * 2}px`;
        wave.style.height = `${radius * 2}px`;
        wave.style.translate = `${x - radius}px ${y - radius}px`;
        container.append(wave);

        const durations = this.#durations(host);
        const spreading = wave.animate([{ scale: 0 }, { scale: 1 }], {
            duration: durations.spread,
            easing: SPREAD_EASING,
            fill: "forwards"
        });
        const release = new AbortController();
        const fadeOut = (): void => {
            release.abort();
            // The wave finishes spreading before it fades, so a quick click still shows it.
            void spreading.finished
                .then(
                    () =>
                        wave.animate([{ opacity: 1 }, { opacity: 0 }], { duration: durations.fade, fill: "forwards" })
                            .finished
                )
                .catch(() => undefined)
                .finally(() => wave.remove());
        };
        for (const type of RELEASE_EVENTS) {
            host.addEventListener(type, fadeOut, { passive: true, signal: release.signal });
        }
    }
}
