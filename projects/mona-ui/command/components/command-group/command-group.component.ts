import { Component, computed, input, signal } from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { commandGroupHeadingThemeVariants, commandGroupThemeVariants } from "../../styles/command.styles";
import type { CommandItemComponent } from "../command-item/command-item.component";

/** A titled set of items. It hides itself while none of its items show. */
@Component({
    selector: "mona-command-group",
    templateUrl: "./command-group.component.html",
    host: {
        role: "group",
        "[attr.aria-labelledby]": "heading() ? headingId : null",
        "[class]": "hostClass()",
        "[class.hidden]": "!visible()"
    }
})
export class CommandGroupComponent {
    readonly #items = signal(ImmutableSet.create<CommandItemComponent>());

    protected readonly headingClass = computed(() => commandGroupHeadingThemeVariants());
    protected readonly headingId = createElementControlId();
    protected readonly hostClass = computed(() => commandGroupThemeVariants());
    protected readonly visible = computed(() => this.#items().any(item => item.visible()));

    /** @description The title above the group's items. */
    public readonly heading = input<string>();

    /** @internal */
    public register(item: CommandItemComponent): void {
        this.#items.update(items => items.add(item));
    }

    /** @internal */
    public unregister(item: CommandItemComponent): void {
        this.#items.update(items => items.remove(item));
    }
}
