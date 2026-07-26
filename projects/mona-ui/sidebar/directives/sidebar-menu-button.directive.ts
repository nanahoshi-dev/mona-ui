import { computed, DestroyRef, Directive, effect, inject, input, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { SidebarMenuButtonSize } from "../models/SidebarMenuButtonSize";
import { SidebarService } from "../services/sidebar.service";

@Directive({
    selector: "button[monaSidebarMenuButton]",
    hostDirectives: [ButtonDirective],
    host: {
        "[attr.title]": "railTitle()",
        // `ButtonDirective` owns the `[class]` binding on this element, so the rail box is driven through
        // style bindings, which also beat the button's own padding without needing `!important`.
        // Sibling elements in the row (a trailing action, a popup host) would otherwise shrink the square.
        "[style.flex-shrink]": "railBox() ? '0' : null",
        // A gap at least as wide as the square guarantees whatever follows the leading visual ends up
        // outside it, rather than leaving a sliver of the label showing. Costs nothing: it is clipped.
        // Both ends are stated inline so the growth animates instead of jumping off the button's own class.
        "[style.gap]": "gap()",
        "[style.height]": "height()",
        // Start aligned rather than centred: a button may hold a trailing chevron or badge after its icon,
        // and centring overflowing content would clip the leading visual as well as the trailing one.
        // Unconditional, so nothing shifts sideways at the moment the rail state flips.
        "[style.justify-content]": "'flex-start'",
        // Also unconditional. The label is clipped by the button's own edge on the way in, which is what
        // makes it slide out of view with the sidebar rather than disappear the instant it collapses.
        "[style.overflow]": "'hidden'",
        "[style.padding]": "padding()",
        "[style.transition]": "transition()",
        // `shrink-0` on the leading visual is what stops a long label from crushing it. It applies to the
        // first child whatever it is — an icon, an avatar — and to any icon elsewhere in the row.
        class:
            "flex w-full font-normal whitespace-nowrap rounded-md " +
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground " +
            "[&>*:first-child]:shrink-0 [&>svg]:shrink-0"
    }
})
export class SidebarMenuButtonDirective {
    readonly #button = inject(ButtonDirective);
    readonly #reducedMotion = signal(false);
    readonly #sidebarService = inject(SidebarService, { optional: true });

    protected readonly gap = computed(() => (this.railBox() ? "2rem" : "0.5rem"));

    /**
     * A large button carries stacked content beside its visual, so it needs a taller row than the icon
     * square. Both ends are stated so the row animates down to the square instead of snapping to it.
     */
    protected readonly height = computed(() => (!this.railBox() && this.size() === "large" ? "3rem" : "2rem"));

    /**
     * The inset that centres the leading visual in the rail square. A `medium` button holds an icon
     * smaller than the square, so it is padded inwards; a `large` one holds something that already
     * fills the square, so padding it would push it out of view.
     */
    protected readonly padding = computed(() => {
        if (!this.railBox()) {
            return "0.25rem";
        }
        return this.size() === "large" ? "0" : "0.5rem";
    });

    /**
     * On the rail the button becomes a square exactly the size of its leading visual and clips its own
     * overflow, so any label is pushed out of view instead of competing for space.
     */
    protected readonly railBox = computed(() => this.#sidebarService?.iconOnly() ?? false);

    // The label is clipped away on the rail, so the leading visual needs something to identify it. Only
    // set there, so the title never duplicates a label that is already legible.
    protected readonly railTitle = computed(() => {
        const tooltip = this.tooltip();
        return tooltip && this.railBox() ? tooltip : null;
    });

    /**
     * Declared inline rather than as a utility class because `ButtonDirective` already sets
     * `transition-colors duration-100` through the class binding it owns, and the two would be decided
     * by stylesheet order. The colour transition is restated here so it survives.
     */
    protected readonly transition = computed(() => {
        if (this.#reducedMotion()) {
            return "none";
        }
        const shape = ["gap", "height", "padding"]
            .map(property => `${property} var(--mona-motion-standard) ease-out`)
            .join(", ");
        return `${shape}, background-color 100ms ease-in-out, color 100ms ease-in-out`;
    });

    /**
     * @description How much room this button's leading visual needs. Use `"large"` when it opens with
     * something avatar sized, so the icon rail lets it fill the square instead of insetting and clipping it.
     * @default "medium"
     */
    public readonly size = input<SidebarMenuButtonSize>("medium");

    /**
     * @description Text identifying this item while the sidebar is collapsed to its icon rail, where the
     * label is clipped away. Applied as the host's `title`, so the browser surfaces it on hover, and an
     * ancestor carrying `monaTooltip` with `mode="content"` renders it as a styled tooltip instead.
     * @default ""
     */
    public readonly tooltip = input("");

    public constructor() {
        const destroyRef = inject(DestroyRef);
        if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
            const query = window.matchMedia("(prefers-reduced-motion: reduce)");
            const onPreferenceChange = (event: MediaQueryListEvent): void => this.#reducedMotion.set(event.matches);
            this.#reducedMotion.set(query.matches);
            query.addEventListener("change", onPreferenceChange);
            destroyRef.onDestroy(() => query.removeEventListener("change", onPreferenceChange));
        }

        effect(() => {
            this.#button.look.set("clear");
        });
    }
}
