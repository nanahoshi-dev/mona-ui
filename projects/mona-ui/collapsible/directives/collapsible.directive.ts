import { booleanAttribute, computed, Directive, forwardRef, input, model, signal } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { COLLAPSIBLE_CONFIG, type CollapsibleConfig } from "../models/CollapsibleConfig";

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
    providers: [{ provide: COLLAPSIBLE_CONFIG, useExisting: forwardRef(() => CollapsibleDirective) }]
})
export class CollapsibleDirective implements CollapsibleConfig {
    readonly #contentIdFromContent = signal<string | null>(null);
    readonly #generatedContentId = createElementControlId();
    protected readonly state = computed(() => (this.expanded() ? "open" : "closed"));

    /**
     * @description Enables the height transition applied to the collapsible content.
     * @default true
     */
    public readonly animate = input(true, { transform: booleanAttribute });

    /**
     * @description Suppresses toggling through the trigger. `expand()` and `collapse()` still apply.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Sets whether the content is expanded. Supports two-way binding.
     * @default false
     */
    public readonly expanded = model(false);

    /**
     * @description Id of the content element, which the trigger references through `aria-controls`. Generated, unless the
     * content element has its own `id`.
     */
    public get contentId(): string {
        return this.#contentIdFromContent() ?? this.#generatedContentId;
    }

    /** Sets `expanded` to `false`. */
    public collapse(): void {
        this.expanded.set(false);
    }

    /** Sets `expanded` to `true`. */
    public expand(): void {
        this.expanded.set(true);
    }

    /**
     * Takes the ID the content element was given, so the trigger points at it. `CollapsibleContentDirective` calls it,
     * so there's no need to.
     */
    public setContentId(id: string | null): void {
        this.#contentIdFromContent.set(id);
    }

    /** Toggles `expanded` unless the root is disabled. */
    public toggle(): void {
        if (this.disabled()) {
            return;
        }
        this.expanded.update(expanded => !expanded);
    }
}
