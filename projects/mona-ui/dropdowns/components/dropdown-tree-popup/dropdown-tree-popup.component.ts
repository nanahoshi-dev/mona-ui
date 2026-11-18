import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, effect, inject, input, type TemplateRef, untracked } from "@angular/core";
import type { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { FilterInputComponent } from "@nanahoshi/mona-ui/internal/filter-input";
import { injectLiveAnnouncer } from "@nanahoshi/mona-ui/internal/live-announcer";
import {
    TREE_DEFAULT_MESSAGES,
    TreeComponent,
    TreeNodeTemplateDirective,
    TreeService
} from "@nanahoshi/mona-ui/internal/tree";
import { PlaceholderComponent } from "@nanahoshi/mona-ui/placeholder";

/**
 * The popup of a dropdown tree and a multi-select tree: an optional filter box, the tree, and the header, footer and
 * "no data" templates. The tree doesn't take focus. Its field keeps it (or the filter box does), and points
 * `aria-activedescendant` at the active node.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
@Component({
    selector: "mona-dropdown-tree-popup",
    imports: [FilterInputComponent, NgTemplateOutlet, PlaceholderComponent, TreeComponent, TreeNodeTemplateDirective],
    templateUrl: "./dropdown-tree-popup.component.html",
    host: {
        class: "contents"
    }
})
export class DropdownTreePopupComponent<T> {
    readonly #announcer = injectLiveAnnouncer();
    readonly #i18n = inject(MonaI18nService);
    protected readonly activeDescendant = computed(() => {
        const node = this.treeService.navigatedNode();
        return node ? this.treeService.getNodeElementId(node.uid) : null;
    });
    protected readonly empty = computed(() => this.treeService.viewNodeSet().isEmpty());
    protected readonly emptyText = computed(() =>
        this.treeService.isTreeFiltered() ? this.messages().noMatches : this.messages().noData
    );
    protected readonly filterAriaLabel = computed(() => {
        const name = this.ariaLabel().trim();
        return name ? this.messages().filterLabel(name) : this.messages().filterTree;
    });
    protected readonly messages = this.#i18n.componentMessages("treeView", TREE_DEFAULT_MESSAGES);
    protected readonly noDataId = computed(() => `${this.treeId()}-no-data`);
    protected readonly treeService = inject<TreeService<T>>(TreeService);

    /** The field's accessible name, which names the tree and its filter box. */
    public readonly ariaLabel = input("");
    /** Ids of the elements that name the field, which name the tree too. */
    public readonly ariaLabelledBy = input("");
    public readonly footerTemplate = input<TemplateRef<unknown> | null | undefined>(null);
    public readonly headerTemplate = input<TemplateRef<unknown> | null | undefined>(null);
    public readonly itemTemplate = input<TemplateRef<unknown> | null | undefined>(null);
    public readonly noDataTemplate = input<TemplateRef<unknown> | null | undefined>(null);
    /** Classes of the popup's surface. */
    public readonly popupClass = input("");
    public readonly size = input<"large" | "medium" | "small">("medium");
    /** The id of the tree, which the field's `aria-controls` points at. */
    public readonly treeId = input.required<string>();

    public constructor() {
        // How many nodes match is announced as the filter changes; opening the popup (with no filter) isn't news.
        let opening = true;
        effect(() => {
            const filterText = this.treeService.filterText();
            const matchCount = this.treeService.matchCount();
            untracked(() => {
                if (opening) {
                    opening = false;
                    return;
                }
                if (!filterText) {
                    return;
                }
                const messages = this.messages();
                void this.#announcer.announce(
                    matchCount === 0 ? messages.noMatches : messages.results(matchCount),
                    "polite"
                );
            });
        });
    }

    protected onFilterChange(event: FilterChangeEvent): void {
        this.treeService.filterChange$.next(event);
        if (!event.isDefaultPrevented()) {
            this.treeService.filter$.next(event.filter);
        }
    }

    /** Keeps focus where it is (the field or the filter box) when a node or the popup's padding is pressed. */
    protected onPointerDown(event: PointerEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.tagName !== "INPUT") {
            event.preventDefault();
        }
    }
}
