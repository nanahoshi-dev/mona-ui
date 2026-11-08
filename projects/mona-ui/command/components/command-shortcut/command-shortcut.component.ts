import { DOCUMENT } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { commandShortcutKeyThemeVariants, commandShortcutThemeVariants } from "../../styles/command.styles";
import { describeShortcut, isApplePlatform } from "../../utils/command-shortcut";

/**
 * Shows an item's shortcut the way the platform writes it. It's only a hint: binding the keys stays with the consumer,
 * who knows what they do.
 */
@Component({
    selector: "mona-command-shortcut",
    templateUrl: "./command-shortcut.component.html",
    host: {
        "[class]": "hostClass()"
    }
})
export class CommandShortcutComponent {
    readonly #apple = isApplePlatform(inject(DOCUMENT).defaultView);

    protected readonly hostClass = computed(() => commandShortcutThemeVariants());
    protected readonly keyClass = computed(() => commandShortcutKeyThemeVariants());
    protected readonly parts = computed(() => describeShortcut(this.keys(), this.#apple));

    /** @description The keys, joined with `+`, such as `mod+k`. `mod` is Command on Apple devices and Ctrl elsewhere. */
    public readonly keys = input.required<string>();
}
