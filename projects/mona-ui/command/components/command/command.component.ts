import { LiveAnnouncer } from "@angular/cdk/a11y";
import {
    afterRenderEffect,
    booleanAttribute,
    Component,
    computed,
    effect,
    inject,
    input,
    model,
    output,
    signal,
    untracked
} from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { COMMAND_DEFAULT_MESSAGES } from "../../i18n/command.default-messages";
import type { CommandFilter, CommandFilterMode } from "../../models/CommandFilter";
import type { CommandSelectEvent } from "../../models/CommandSelectEvent";
import { commandBaseThemeVariants, type CommandVariantProps } from "../../styles/command.styles";
import { defaultCommandFilter } from "../../utils/command-filter";
import type { CommandItemComponent } from "../command-item/command-item.component";

/**
 * A searchable list of actions or options, operated from one input. It works inline, in a popover, or in a
 * `mona-command-dialog`. It only runs what the consumer asks for: choosing an item emits an event, and nothing closes
 * or navigates by itself.
 */
@Component({
    selector: "mona-command",
    template: "<ng-content />",
    host: {
        "[class]": "baseClass()"
    }
})
export class CommandComponent {
    readonly #activeItem = signal<CommandItemComponent | null>(null);
    readonly #i18n = inject(MonaI18nService);
    readonly #inputElement = signal<HTMLInputElement | null>(null);
    readonly #items = signal(ImmutableSet.create<CommandItemComponent>());
    readonly #liveAnnouncer = inject(LiveAnnouncer);

    readonly #visibleItems = computed(() =>
        this.#items()
            .where(item => item.visible())
            .toArray()
    );

    protected readonly baseClass = computed(() => commandBaseThemeVariants({ rounded: this.rounded() }));

    /**
     * The item Enter would choose.
     * @internal
     */
    public readonly activeItem = this.#activeItem.asReadonly();
    /**
     * @description What counts as a match while `filterMode` is `"auto"`.
     * @default defaultCommandFilter
     */
    public readonly filter = input<CommandFilter>(defaultCommandFilter);
    /** @description Whether the component filters the items, or the consumer supplies only the matching ones. */
    public readonly filterMode = input<CommandFilterMode>("auto");
    /**
     * Whether there's nothing to show for the current query.
     * @internal
     */
    public readonly isEmpty = computed(() => this.query().trim() !== "" && !this.loading() && this.resultCount() === 0);
    /** @description Emits when any item is chosen, with the pointer or with Enter. */
    public readonly itemSelect = output<CommandSelectEvent>();
    /**
     * The id the input points at with `aria-controls`.
     * @internal
     */
    public readonly listId = createElementControlId();
    /** @description Whether results are on their way. Shows `mona-command-loading` and holds back the empty state. */
    public readonly loading = input(false, { transform: booleanAttribute });
    /** @description Whether the arrow keys wrap around at the ends of the list. */
    public readonly loop = input(true, { transform: booleanAttribute });
    /** @internal */
    public readonly messages = this.#i18n.componentMessages("command", COMMAND_DEFAULT_MESSAGES);
    /** @description The text in the input. */
    public readonly query = model("");
    /**
     * How many items are showing.
     * @internal
     */
    public readonly resultCount = computed(() => this.#visibleItems().length);
    /** @description The corner radius. */
    public readonly rounded = input<CommandVariantProps["rounded"]>("medium");

    public constructor() {
        this.#keepAnItemActive();
        this.#announceResults();
    }

    /** Moves focus to the input. */
    public focus(): void {
        this.#inputElement()?.focus();
    }

    /**
     * Whether an item shows for the current query.
     * @internal
     */
    public matches(item: CommandItemComponent): boolean {
        const query = this.query().trim();
        if (this.filterMode() === "manual" || query === "") {
            return true;
        }
        return this.filter()(query, { keywords: item.keywords(), value: item.value() });
    }

    /**
     * Moves the active item, skipping disabled ones.
     * @internal
     */
    public move(step: 1 | -1): void {
        const items = this.#enabledInOrder();
        if (items.length === 0) {
            return;
        }
        const active = this.#activeItem();
        const current = active ? items.indexOf(active) : -1;
        let next = current === -1 ? (step === 1 ? 0 : items.length - 1) : current + step;
        if (next < 0 || next >= items.length) {
            if (!this.loop()) {
                return;
            }
            next = next < 0 ? items.length - 1 : 0;
        }
        this.#activeItem.set(items[next]);
        items[next].scrollIntoView();
    }

    /** @internal */
    public register(item: CommandItemComponent): void {
        this.#items.update(items => items.add(item));
    }

    /** @internal */
    public registerInput(element: HTMLInputElement): void {
        this.#inputElement.set(element);
    }

    /**
     * Chooses the active item.
     * @internal
     */
    public selectActive(event: KeyboardEvent): void {
        const item = this.#activeItem();
        if (item) {
            this.selectItem(item, event);
        }
    }

    /** @internal */
    public selectItem(item: CommandItemComponent, event: KeyboardEvent | MouseEvent): void {
        if (item.disabled()) {
            return;
        }
        const selection: CommandSelectEvent = { originalEvent: event, value: item.value() };
        item.itemSelect.emit(selection);
        this.itemSelect.emit(selection);
    }

    /** @internal */
    public setActive(item: CommandItemComponent): void {
        if (!item.disabled()) {
            this.#activeItem.set(item);
        }
    }

    /** @internal */
    public unregister(item: CommandItemComponent): void {
        this.#items.update(items => items.remove(item));
    }

    /**
     * Announces the outcome of a search. The live region is the CDK's, at the end of the document, so it never becomes
     * part of the list. The active item needs no announcement: `aria-activedescendant` does that.
     */
    #announceResults(): void {
        let lastState = "";
        effect(() => {
            const query = this.query().trim();
            const count = this.resultCount();
            const loading = this.loading();
            untracked(() => {
                if (loading) {
                    return;
                }
                const state = query === "" ? "" : `${query}\u0000${count}`;
                if (state === lastState) {
                    return;
                }
                lastState = state;
                if (query !== "") {
                    const messages = this.messages();
                    void this.#liveAnnouncer.announce(
                        count === 0 ? messages.noResults : messages.resultsAvailable(count),
                        "polite"
                    );
                }
            });
        });
    }

    /** The items that can be chosen, in the order they're on the page, whatever order they were created in. */
    #enabledInOrder(): CommandItemComponent[] {
        return this.#visibleItems()
            .filter(item => !item.disabled())
            .sort((first, second) => first.compareOrder(second));
    }

    /**
     * Enter always has something to choose while there are results: a new query starts from the first one, and new
     * results keep the active item as long as it's still among them. This runs after rendering because it reads the
     * items' order from the page.
     */
    #keepAnItemActive(): void {
        let lastQuery = "";
        afterRenderEffect(() => {
            const query = this.query();
            const visible = this.#visibleItems();
            untracked(() => {
                const active = this.#activeItem();
                const queryChanged = query !== lastQuery;
                lastQuery = query;
                if (!queryChanged && active && visible.includes(active) && !active.disabled()) {
                    return;
                }
                const first = this.#enabledInOrder().at(0) ?? null;
                this.#activeItem.set(first);
                if (queryChanged) {
                    first?.scrollListToTop();
                }
            });
        });
    }
}
