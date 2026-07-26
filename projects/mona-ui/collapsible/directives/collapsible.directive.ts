import { computed, Directive, forwardRef, input, model } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { type CollapsibleConfig, CollapsibleToken } from "../models/CollapsibleConfig";

/**
 * @description
 * Headless disclosure root. Adds no markup of its own, so it can be applied to any element
 * (`li`, `div`, `section`) and paired with `monaCollapsibleTrigger` and `monaCollapsibleContent`.
 */
@Directive({
    selector: "[monaCollapsible]",
    exportAs: "monaCollapsible",
    host: {
        "[attr.data-state]": "state()"
    },
    providers: [{ provide: CollapsibleToken, useExisting: forwardRef(() => CollapsibleDirective) }]
})
export class CollapsibleDirective implements CollapsibleConfig {
    protected readonly state = computed(() => (this.expanded() ? "open" : "closed"));

    /**
     * @description Enables the height transition applied to the collapsible content.
     * @default true
     */
    public readonly animate = input(true);

    /**
     * @description Id assigned to the content element and referenced by the trigger through `aria-controls`.
     */
    public readonly contentId = createElementControlId();

    /**
     * @description Suppresses toggling through the trigger. `expand()` and `collapse()` still apply.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Sets whether the content is expanded. Supports two-way binding.
     * @default false
     */
    public readonly expanded = model(false);

    public collapse(): void {
        this.expanded.set(false);
    }

    public expand(): void {
        this.expanded.set(true);
    }

    public toggle(): void {
        if (this.disabled()) {
            return;
        }
        this.expanded.update(expanded => !expanded);
    }
}
