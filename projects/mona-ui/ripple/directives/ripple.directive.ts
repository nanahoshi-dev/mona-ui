import {
    afterNextRender,
    booleanAttribute,
    DestroyRef,
    Directive,
    DOCUMENT,
    ElementRef,
    inject,
    input,
    NgZone,
    type Signal,
    signal
} from "@angular/core";
import { rippleContainerClasses, rippleWaveClasses } from "../styles/ripple.styles";
import { RIPPLE_OPTIONS } from "../tokens/ripple.tokens";
import { parseCssTime } from "../utils/parse-css-time";

/** Used when the theme sets no `--mona-motion-standard`. */
const FALLBACK_SPREAD_DURATION = 300;
/** Used when the theme sets no `--mona-motion-fast`. */
const FALLBACK_FADE_DURATION = 200;
/** Fast at first and slow to settle, so that even a short press shows the wave spreading. */
const SPREAD_EASING = "cubic-bezier(0.2, 0, 0, 1)";
const RELEASE_EVENTS = ["pointercancel", "pointerleave", "pointerup"] as const;

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
 * the theme's `--mona-motion-standard`, fades over its `--mona-motion-fast`, and its opacity is
 * `--mona-ripple-opacity`, 12% unless set.
 *
 * There is no ripple on a disabled or `aria-disabled` element, with the system's reduced motion setting, or in forced
 * colors. Keyboard presses have none either: the focus indicator already shows where they act.
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
        if (!this.#options.enabled) {
            return;
        }
        const destroyRef = inject(DestroyRef);
        const zone = inject(NgZone);
        afterNextRender(() => {
            const host = this.#hostElementRef.nativeElement;
            const listener = (event: PointerEvent): void => this.#launch(event);
            // A press changes nothing Angular renders, so it shouldn't start change detection in a zone.js app.
            zone.runOutsideAngular(() => host.addEventListener("pointerdown", listener, { passive: true }));
            destroyRef.onDestroy(() => host.removeEventListener("pointerdown", listener));
        });
    }

    /**
     * Lets a component that applies this directive as a host directive turn the ripple off, such as a button whose look
     * has no surface to draw it on.
     * @hidden Used by Mona UI's own components.
     */
    public setHostDisabled(disabled: Signal<boolean>): void {
        this.#hostDisabled = disabled;
    }

    #canDraw(host: HTMLElement): boolean {
        if (this.disabled() || this.#hostDisabled() || host.matches(":disabled, [aria-disabled='true']")) {
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
            fade: parseCssTime(style?.getPropertyValue("--mona-motion-fast") ?? "", FALLBACK_FADE_DURATION),
            spread: parseCssTime(style?.getPropertyValue("--mona-motion-standard") ?? "", FALLBACK_SPREAD_DURATION)
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
        if (event.button !== 0 || !this.#canDraw(host)) {
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
