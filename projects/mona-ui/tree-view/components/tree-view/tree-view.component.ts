import { LiveAnnouncer } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    isDevMode,
    NgZone,
    output,
    TemplateRef,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId, injectLabelledByText } from "@nanahoshi/mona-ui/internal";
import { FilterInputComponent } from "@nanahoshi/mona-ui/internal/filter-input";
import {
    type ChildrenLoadErrorEvent,
    type ChildrenSelector,
    type DataStructure,
    type DropPosition,
    type ITreeView,
    type NodeClickEvent,
    type NodeItem,
    type NodeMoveSnapshot,
    TreeComponent,
    type TreeNode,
    TreeNodeTemplateDirective,
    TreeService
} from "@nanahoshi/mona-ui/internal/tree";
import { PlaceholderComponent } from "@nanahoshi/mona-ui/placeholder";
import type { Predicate, Selector } from "@mirei/ts-collections";
import { TreeViewNodeTemplateDirective } from "../../directives/tree-view-node-template.directive";
import { TREE_VIEW_DEFAULT_MESSAGES } from "../../i18n/tree-view.default-messages";
import type { TreeViewNodeTemplateContext } from "../../models/TreeViewNodeTemplateContext";

/** A load that finishes within this time isn't announced; the children just appear. */
const LOADING_ANNOUNCEMENT_DELAY = 400;

@Component({
    selector: "mona-tree-view",
    imports: [FilterInputComponent, PlaceholderComponent, TreeComponent, TreeNodeTemplateDirective, NgTemplateOutlet],
    templateUrl: "./tree-view.component.html",
    providers: [TreeService],
    host: {
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null"
    }
})
export class TreeViewComponent<T> implements ITreeView<T> {
    readonly #announcer = inject(LiveAnnouncer);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #labelledByText = injectLabelledByText(() => this.ariaLabelledBy());
    readonly #loadingTimers = new Set<ReturnType<typeof setTimeout>>();
    readonly #zone = inject(NgZone);
    /** The filter text the user typed, announced with its result count once the tree applies it. */
    #pendingFilterAnnouncement: string | null = null;
    protected readonly empty = computed(() => this.treeService.viewNodeSet().isEmpty());
    protected readonly emptyText = computed(() =>
        this.treeService.isTreeFiltered() ? this.messages().noMatches : this.messages().noData
    );
    /** "Filter {name}", from the tree's `aria-label` or else the text of its `aria-labelledby` elements. */
    protected readonly filterAriaLabel = computed<string>(() => {
        const name = this.ariaLabel().trim() || this.#labelledByText();
        return name ? this.messages().filterLabel(name) : this.messages().filterTree;
    });
    protected readonly messages = this.#i18n.componentMessages("treeView", TREE_VIEW_DEFAULT_MESSAGES);
    protected readonly nodeTemplate = contentChild<
        TreeViewNodeTemplateDirective<T>,
        TemplateRef<TreeViewNodeTemplateContext<T>>
    >(TreeViewNodeTemplateDirective, { read: TemplateRef });
    protected readonly statusId = `${createElementControlId()}-status`;
    protected readonly treeId = createElementControlId();
    protected readonly treeService = inject(TreeService<T>);

    /**
     * @description Enables CSS transitions when nodes expand or collapse. Accepts the attribute form
     * (`animate="false"`).
     * @default true
     */
    public readonly animate = input(true, { transform: booleanAttribute });

    /**
     * @description Accessible name of the tree. Describe what the tree represents; it also names the filter input
     * ("Filter {name}"). Set this or `aria-labelledby`: an unnamed tree logs a warning in development. A plain
     * `aria-label` attribute on `mona-tree-view` doesn't name the tree.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Id of the element that names the tree, as an alternative to `aria-label`.
     * @default ""
     */
    public readonly ariaLabelledBy = input<string>("", { alias: "aria-labelledby" });

    /**
     * @description Emitted when the tree-view loses focus.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native
    public readonly blur = output<FocusEvent>();

    /**
     * @description Property name or accessor used to derive a node's children from a data item. Accepts a property name, a function returning the children, or a function returning an observable of the children.
     * @default ""
     */
    public readonly children = input<ChildrenSelector<T>>("");

    /**
     * @description Emitted when the children observable of a node errors. The node is collapsed again and marked
     * as failed (its expander reads "Retry loading {node}"), the failure is announced, and expanding the node
     * retries the load.
     */
    public readonly childrenLoadError = output<ChildrenLoadErrorEvent<T>>();

    /**
     * @description Collection of items to render.
     * @default []
     */
    public readonly data = input<Iterable<T>>([]);

    /**
     * @description Emitted when the tree-view gains focus.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native
    public readonly focus = output<FocusEvent>();

    /**
     * @description Predicate that determines whether a node has children. Required when the children selector returns an observable.
     * @default null
     */
    public readonly hasChildren = input<Predicate<T> | null>(null);

    /**
     * @description Property name that holds a node's unique identifier. Required when `mode` is set to `"flat"`.
     * @default ""
     */
    public readonly idField = input<string>("");

    /**
     * @description Shape of the source data: `"hierarchical"` for nested items via `children`, or `"flat"` for a flat list linked by `idField` and `parentIdField`.
     * @default "hierarchical"
     */
    public readonly mode = input<DataStructure>("hierarchical");

    /**
     * @description Emitted when a node is clicked.
     */
    public readonly nodeClick = output<NodeClickEvent<T>>();

    /**
     * @description Property name that holds a node's parent identifier. Required when `mode` is set to `"flat"`.
     * @default ""
     */
    public readonly parentIdField = input<string>("");

    /**
     * @description Property name or accessor used to derive the display text from a data item.
     * @default ""
     */
    public readonly textField = input<string | Selector<T, string>>("");

    public constructor() {
        // The text is read when nodes render, so changing it doesn't rebuild the nodes (which would undo moves).
        effect(() => {
            const textField = this.textField();
            untracked(() => this.treeService.setTextField(textField));
        });
        // Only the data and its structure rebuild the nodes.
        effect(() => {
            const mode = this.mode();
            if (mode === "flat") {
                this.#setFlatDataStructureFields();
            } else if (mode === "hierarchical") {
                this.#setHierarchicalDataStructureFields();
            }
            const data = this.data();
            untracked(() => {
                this.treeService.setDataStructure(mode);
                this.treeService.setData(data);
            });
        });
        effect(() => {
            const animate = this.animate();
            untracked(() => {
                this.treeService.setAnimationEnabled(animate);
            });
        });
        effect(() => {
            const filterText = this.treeService.filterText();
            const matchCount = this.treeService.matchCount();
            untracked(() => this.#announceFilterResults(filterText, matchCount));
        });
        this.treeService.nodeClick$.pipe(takeUntilDestroyed()).subscribe(event => this.nodeClick.emit(event));
        this.treeService.focus$.pipe(takeUntilDestroyed()).subscribe(event => this.focus.emit(event));
        this.treeService.blur$.pipe(takeUntilDestroyed()).subscribe(event => this.blur.emit(event));
        this.treeService.childrenLoadStart$
            .pipe(takeUntilDestroyed())
            .subscribe(node => this.#announceLoadingAfterDelay(node));
        inject(DestroyRef).onDestroy(() => this.#loadingTimers.forEach(timer => clearTimeout(timer)));
        this.treeService.childrenLoadError$.pipe(takeUntilDestroyed()).subscribe(({ error, node }) => {
            this.#announcer.announce(this.messages().loadError(this.treeService.getNodeText(node)), "polite");
            this.childrenLoadError.emit({ error, node: node.nodeItem });
        });
        if (isDevMode()) {
            afterNextRender({ read: () => this.#warnIfUnnamed() });
        }
    }

    /**
     * Moves a node in the tree's internal structure, without going through `data`.
     * @returns a snapshot for `undoMoveNode`, or `null` when nothing moved: `position` is `"outside"`, a node isn't
     * in the tree, or the move isn't possible (onto the node itself or into its own subtree, inside its own parent or
     * a disabled node).
     */
    public moveNode(source: NodeItem<T>, target: NodeItem<T>, position: DropPosition): NodeMoveSnapshot | null {
        if (position === "outside") {
            return null;
        }
        const sourceNode = this.treeService.getNodeByUid(source.uid);
        if (!sourceNode) {
            return null;
        }
        const targetNode = this.treeService.getNodeByUid(target.uid);
        if (!targetNode) {
            return null;
        }
        const originalParentUid = sourceNode.parent?.uid ?? null;
        const originalIndex =
            sourceNode.parent !== null
                ? sourceNode.parent.children().toList().indexOf(sourceNode)
                : this.treeService.nodeSet().toList().indexOf(sourceNode);
        if (!this.treeService.moveNode(sourceNode, targetNode, position)) {
            return null;
        }
        return { originalParentUid, originalIndex, sourceNodeUid: sourceNode.uid };
    }

    /** Reverts a move previously performed by `moveNode`. */
    public undoMoveNode(snapshot: NodeMoveSnapshot): void {
        const sourceNode = this.treeService.getNodeByUid(snapshot.sourceNodeUid);
        if (!sourceNode) {
            return;
        }
        if (snapshot.originalParentUid === null) {
            this.treeService.detachNode(sourceNode);
            this.treeService.insertNodeAtIndex(sourceNode, null, snapshot.originalIndex);
        } else {
            this.treeService.detachNode(sourceNode);
            this.treeService.insertNodeAtIndex(sourceNode, snapshot.originalParentUid, snapshot.originalIndex);
        }
    }

    protected onFilterChange(event: FilterChangeEvent): void {
        this.treeService.filterChange$.next(event);
        if (!event.isDefaultPrevented()) {
            this.#pendingFilterAnnouncement = event.filter;
            this.treeService.filter$.next(event.filter);
        }
    }

    /**
     * Announces a load that is still running after a moment; quicker loads just show their children. The timer runs
     * outside Angular, so it doesn't hold up the app's stability.
     */
    #announceLoadingAfterDelay(node: TreeNode<T>): void {
        this.#zone.runOutsideAngular(() => {
            const timer = setTimeout(() => {
                this.#loadingTimers.delete(timer);
                if (node.loading()) {
                    this.#announcer.announce(this.messages().loadingNode(this.treeService.getNodeText(node)), "polite");
                }
            }, LOADING_ANNOUNCEMENT_DELAY);
            this.#loadingTimers.add(timer);
        });
    }

    /** Announces how many nodes match once the filter the user typed applies. Filters set from code aren't announced. */
    #announceFilterResults(filterText: string, matchCount: number): void {
        if (this.#pendingFilterAnnouncement === null || this.#pendingFilterAnnouncement !== filterText) {
            return;
        }
        this.#pendingFilterAnnouncement = null;
        if (!filterText) {
            return;
        }
        const messages = this.messages();
        this.#announcer.announce(matchCount === 0 ? messages.noMatches : messages.results(matchCount), "polite");
    }

    #setFlatDataStructureFields(): void {
        const idField = this.idField();
        const parentIdField = this.parentIdField();
        untracked(() => {
            this.treeService.setFlatIdField(idField);
            this.treeService.setFlatParentIdField(parentIdField);
        });
    }

    #setHierarchicalDataStructureFields(): void {
        const childrenSelector = this.children();
        const hasChildren = this.hasChildren();
        untracked(() => {
            this.treeService.setChildrenSelector(childrenSelector);
            this.treeService.setHasChildrenPredicate(hasChildren);
        });
    }

    #warnIfUnnamed(): void {
        if (this.ariaLabel().trim() || this.ariaLabelledBy().trim()) {
            return;
        }
        console.warn(
            "[Mona TreeView] A tree view needs an accessible name. Set aria-label or aria-labelledby.",
            this.#hostElementRef.nativeElement
        );
    }
}
