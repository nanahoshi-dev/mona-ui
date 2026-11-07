import { booleanAttribute, Component, computed, DestroyRef, ElementRef, inject, input, output } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import type { CommandSelectEvent } from "../../models/CommandSelectEvent";
import { commandItemThemeVariants } from "../../styles/command.styles";
import { CommandComponent } from "../command/command.component";
import { CommandGroupComponent } from "../command-group/command-group.component";

/** One action or option in a `mona-command`. What it shows is its content; what it's found by is its value. */
@Component({
    selector: "mona-command-item",
    template: "<ng-content />",
    host: {
        role: "option",
        "[attr.aria-disabled]": "disabled() || null",
        "[attr.aria-selected]": "active()",
        "[attr.data-active]": "active()",
        "[attr.data-disabled]": "disabled() || null",
        "[class]": "hostClass()",
        "[class.hidden]": "!visible()",
        "[id]": "id",
        "(click)": "onClick($event)",
        "(mousedown)": "$event.preventDefault()",
        "(pointermove)": "onPointerMove()"
    }
})
export class CommandItemComponent {
    readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #group = inject(CommandGroupComponent, { optional: true });
    readonly #root = inject(CommandComponent);

    protected readonly active = computed(() => this.#root.activeItem() === this);
    protected readonly hostClass = computed(() => commandItemThemeVariants());

    /** @description Whether the item shows but can't be chosen. */
    public readonly disabled = input(false, { transform: booleanAttribute });
    /** @internal */
    public readonly id = createElementControlId();
    /** @description Emits when this item is chosen, with the pointer or with Enter. */
    public readonly itemSelect = output<CommandSelectEvent>();
    /** @description Other words the item should be found by, such as synonyms. */
    public readonly keywords = input<readonly string[]>([]);
    /** @description What the item is found by, and what the select event carries. */
    public readonly value = input.required<string>();
    /**
     * Whether the item shows for the current query.
     * @internal
     */
    public readonly visible = computed(() => this.#root.matches(this));

    public constructor() {
        this.#root.register(this);
        this.#group?.register(this);
        inject(DestroyRef).onDestroy(() => {
            this.#root.unregister(this);
            this.#group?.unregister(this);
        });
    }

    /**
     * Negative when this item comes before the other on the page.
     * @internal
     */
    public compareOrder(other: CommandItemComponent): number {
        const position = this.#element.nativeElement.compareDocumentPosition(other.#element.nativeElement);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    }

    /** @internal */
    public scrollIntoView(): void {
        this.#element.nativeElement.scrollIntoView({ block: "nearest" });
    }

    /**
     * Back to the top rather than to this item, so the first group's heading shows too.
     * @internal
     */
    public scrollListToTop(): void {
        const list = this.#element.nativeElement.closest("[role='listbox']");
        if (list) {
            list.scrollTop = 0;
        }
    }

    protected onClick(event: MouseEvent): void {
        this.#root.selectItem(this, event);
    }

    /** Not `mouseenter`: that also fires when the list scrolls under a resting pointer, which would steal the active item. */
    protected onPointerMove(): void {
        this.#root.setActive(this);
    }
}
