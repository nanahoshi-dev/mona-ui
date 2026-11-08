import { Component, computed, inject, input } from "@angular/core";
import { commandHighlightMarkThemeVariants } from "../../styles/command.styles";
import { splitByQuery } from "../../utils/command-filter";
import { CommandComponent } from "../command/command.component";

/** Shows a text with the parts the query matches marked. Marks the query's words, however the item was matched. */
@Component({
    selector: "mona-command-highlight",
    templateUrl: "./command-highlight.component.html"
})
export class CommandHighlightComponent {
    readonly #root = inject(CommandComponent);

    protected readonly markClass = computed(() => commandHighlightMarkThemeVariants());
    protected readonly parts = computed(() => splitByQuery(this.text(), this.#root.query()));

    /** @description The text to show. */
    public readonly text = input.required<string>();
}
