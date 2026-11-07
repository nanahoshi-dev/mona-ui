import { booleanAttribute, Component, effect, forwardRef, input, signal, untracked } from "@angular/core";
import { EXPANSION_PANEL_ACCORDION } from "../../models/accordion.token";
import type { ExpansionPanelComponent } from "../expansion-panel/expansion-panel.component";

/**
 * @description
 * Groups `mona-expansion-panel` elements: only one is open at a time unless `multiple` is set, and Up, Down, Home and End
 * move between their headers. Adds no role of its own, as the pattern asks: each panel brings its heading and region.
 */
@Component({
    selector: "mona-accordion",
    template: ` <ng-content></ng-content> `,
    host: {
        class: "block w-full",
        "(keydown)": "onKeydown($event)"
    },
    providers: [{ provide: EXPANSION_PANEL_ACCORDION, useExisting: forwardRef(() => AccordionComponent) }]
})
export class AccordionComponent {
    readonly #registered = signal<readonly ExpansionPanelComponent[]>([]);
    #openPanels: readonly ExpansionPanelComponent[] = [];

    /**
     * @description Lets several panels stay open. Without it, opening a panel closes the others, however it was opened.
     * @default false
     */
    public readonly multiple = input(false, { transform: booleanAttribute });

    public constructor() {
        effect(() => {
            const open = this.#inDocumentOrder().filter(panel => panel.expanded());
            const multiple = this.multiple();
            untracked(() => this.#enforceSingleOpen(open, multiple));
        });
    }

    /**
     * @internal
     */
    public register(panel: ExpansionPanelComponent): () => void {
        this.#registered.update(panels => [...panels, panel]);
        return () => this.#registered.update(panels => panels.filter(other => other !== panel));
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }
        const panels = this.#inDocumentOrder().filter(panel => !panel.disabled());
        const current = panels.findIndex(panel => panel.ownsTrigger(event.target));
        if (current === -1) {
            return;
        }
        const target = this.#targetFor(event.key, panels, current);
        if (target) {
            event.preventDefault();
            target.focus();
        }
    }

    /** The panel opened last is the one that stays, so a panel opened by a binding wins just as a clicked one does. */
    #enforceSingleOpen(open: readonly ExpansionPanelComponent[], multiple: boolean): void {
        const previous = this.#openPanels;
        this.#openPanels = open;
        if (multiple || open.length < 2) {
            return;
        }
        const keep = open.filter(panel => !previous.includes(panel)).at(-1) ?? open[0];
        open.filter(panel => panel !== keep).forEach(panel => panel.collapse());
    }

    /** Worked out each time, because a panel can be moved without anything registering. */
    #inDocumentOrder(): readonly ExpansionPanelComponent[] {
        return [...this.#registered()].sort((first, second) => first.compareDocumentOrder(second));
    }

    #targetFor(
        key: string,
        panels: readonly ExpansionPanelComponent[],
        current: number
    ): ExpansionPanelComponent | undefined {
        switch (key) {
            case "ArrowDown":
                return panels[(current + 1) % panels.length];
            case "ArrowUp":
                return panels[(current - 1 + panels.length) % panels.length];
            case "Home":
                return panels[0];
            case "End":
                return panels[panels.length - 1];
            default:
                return undefined;
        }
    }
}
