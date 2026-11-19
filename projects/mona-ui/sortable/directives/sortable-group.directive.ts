import { CdkDropListGroup } from "@angular/cdk/drag-drop";
import { computed, Directive, signal } from "@angular/core";
import type { SortableDirective } from "./sortable.directive";

/**
 * @description
 * Connects the sortable lists inside it, so an item can move from one to another: dragged, or with Control+Shift and
 * the arrow keys that cross the lists, such as Left and Right between columns. The lists keep their own items; the
 * one an item lands in emits the move.
 */
@Directive({
    selector: "[monaSortableGroup]",
    exportAs: "monaSortableGroup",
    hostDirectives: [CdkDropListGroup]
})
export class SortableGroupDirective {
    readonly #lists = signal<readonly SortableDirective<unknown>[]>([]);

    /**
     * @internal
     * How many lists the group has.
     */
    public readonly listCount = computed(() => this.#lists().length);

    /**
     * @internal
     * The group's lists in the order they appear in the page.
     */
    public orderedLists(): SortableDirective<unknown>[] {
        return [...this.#lists()].sort((first, second) =>
            first.element.compareDocumentPosition(second.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
        );
    }

    /** @internal */
    public register(list: SortableDirective<unknown>): void {
        this.#lists.update(lists => [...lists, list]);
    }

    /** @internal */
    public unregister(list: SortableDirective<unknown>): void {
        this.#lists.update(lists => lists.filter(candidate => candidate !== list));
    }
}
