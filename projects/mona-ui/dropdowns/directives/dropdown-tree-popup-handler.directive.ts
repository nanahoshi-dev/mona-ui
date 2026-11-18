import { afterNextRender, DestroyRef, Directive, effect, ElementRef, inject, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { injectComponentDirection } from "@nanahoshi/mona-ui/i18n";
import { setupTypeahead } from "@nanahoshi/mona-ui/internal";
import { handleTreeNavigationKey, type TreeNode, TreeService } from "@nanahoshi/mona-ui/internal/tree";
import { PopupCloseEvent, PopupCloseSource } from "@nanahoshi/mona-ui/popup";
import { filter, fromEvent, Subject } from "rxjs";
import { DROPDOWN_POPUP_INPUT_TOKEN } from "../models/DropdownPopupInput";
import { DropdownService } from "../services/dropdown.service";
import { DropdownPopupHandlerDirective } from "./dropdown-popup-handler.directive";

/**
 * Opens and closes the popup of a dropdown tree or a multi-select tree, and moves through its tree.
 *
 * The field keeps focus, or the popup's filter box does, and the tree follows: the arrow keys, Home, End, `*` and
 * typeahead move its active node the way they move a focused tree's. Enter and Space go to the component through
 * `DropdownService.keydown$`, to select or check the active node.
 *
 * When the popup opens, the selected node (or the first checked one) becomes the active node, with its ancestors
 * opened; without one, the first node does. As the filter changes, its first match does. Closing the popup clears
 * the filter.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
@Directive({
    selector: "[monaDropdownTreePopupHandler]",
    hostDirectives: [DropdownPopupHandlerDirective]
})
export class DropdownTreePopupHandlerDirective<T> {
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #dropdownService = inject(DropdownService);
    readonly #host = inject(DROPDOWN_POPUP_INPUT_TOKEN);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #treeService = inject<TreeService<T>>(TreeService);
    readonly #typeahead$ = new Subject<string>();

    public constructor() {
        afterNextRender({
            read: () => {
                this.setHostEvents();
                setupTypeahead(this.#typeahead$)
                    .pipe(takeUntilDestroyed(this.#destroyRef))
                    .subscribe(buffer => {
                        const node = this.#treeService.findNodeByText(buffer);
                        if (node) {
                            this.#treeService.navigatedNode.set(node);
                        }
                    });
            }
        });
        // The filter box keeps the keys it edits with; the arrow keys and Enter reach the popup.
        effect(onCleanup => {
            const popupElement = this.#dropdownService.popupRef()?.overlayRef.overlayElement;
            if (popupElement == null) {
                return;
            }
            untracked(() => this.activateCurrentNode());
            const onKeydown = (event: KeyboardEvent): void => this.handleFilterKeydown(event);
            popupElement.addEventListener("keydown", onKeydown);
            onCleanup(() => popupElement.removeEventListener("keydown", onKeydown));
        });
        // As the filter changes, its first match becomes the active node, so Enter picks it.
        effect(() => {
            const filterText = this.#treeService.filterText();
            untracked(() => {
                if (!filterText || this.#dropdownService.popupRef() === null) {
                    return;
                }
                const match = this.#treeService.findFirstMatch();
                if (match) {
                    this.#treeService.navigatedNode.set(match);
                }
            });
        });
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.#treeService.navigatedNode.set(null);
            this.#treeService.clearFilter();
        });
    }

    /** Makes the selected node, or else the first checked one, the active node, opening its ancestors to show it. */
    private activateCurrentNode(): void {
        const treeService = this.#treeService;
        const node =
            treeService.selectedNodes().firstOrDefault() ??
            TreeService.flatten(treeService.nodeSet()).firstOrDefault(n => n.checked()) ??
            null;
        if (node === null) {
            treeService.navigatedNode.set(null);
            treeService.navigate("first");
            return;
        }
        const ancestors: TreeNode<T>[] = [];
        for (let parent = node.parent; parent !== null; parent = parent.parent) {
            ancestors.unshift(parent);
        }
        for (const ancestor of ancestors) {
            if (!treeService.isExpanded(ancestor)) {
                treeService.setNodeExpand(ancestor, true);
            }
        }
        treeService.navigatedNode.set(node);
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
    }

    /** Arrow keys and Enter pressed in the popup's filter box. */
    private handleFilterKeydown(event: KeyboardEvent): void {
        const target = event.target;
        if (
            event.isComposing ||
            event.keyCode === 229 ||
            !(target instanceof HTMLInputElement) ||
            target.closest("mona-filter-input") === null
        ) {
            return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            this.navigate(event);
        } else if (event.key === "Enter") {
            event.preventDefault();
            this.#dropdownService.keydown$.next(event);
        }
    }

    private handleHostKeydown(event: KeyboardEvent): void {
        // Keys pressed while an IME composes text belong to the IME. Safari reports the confirming Enter with
        // isComposing false but keyCode 229.
        if (event.isComposing || event.keyCode === 229) {
            return;
        }
        const beforeKeydown = new PreventableEvent("beforeKeydown", event);
        this.#dropdownService.beforeKeydown$.next(beforeKeydown);
        if (beforeKeydown.isDefaultPrevented()) {
            return;
        }
        const popupRef = this.#dropdownService.popupRef();
        if (event.key === "Escape") {
            // Left alone while closed, so a dialog around the field can close with it.
            popupRef?.close(new PopupCloseEvent({ event, originalEvent: event, via: PopupCloseSource.Escape }));
            return;
        }
        if (event.key === "Tab") {
            this.closePopup();
            return;
        }
        if (event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            if (event.key === "ArrowDown") {
                this.#dropdownService.triggerPopupOpen$.next({});
            } else {
                this.closePopup();
            }
            return;
        }
        const opening =
            event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ";
        if (popupRef === null) {
            if (opening) {
                event.preventDefault();
                this.#dropdownService.triggerPopupOpen$.next({});
            } else {
                this.#dropdownService.keydown$.next(event);
            }
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.#dropdownService.keydown$.next(event);
            return;
        }
        if (!this.navigate(event)) {
            this.#dropdownService.keydown$.next(event);
        }
    }

    private navigate(event: KeyboardEvent): boolean {
        return handleTreeNavigationKey(event, {
            rtl: this.#direction() === "rtl",
            treeService: this.#treeService,
            typeahead: key => this.#typeahead$.next(key)
        });
    }

    private setHostEvents(): void {
        const host = this.#hostElementRef.nativeElement;
        const usable = (): boolean => !this.#host.disabled() && !this.#host.readonly();
        fromEvent<MouseEvent>(host, "click")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => usable() && (event.target as HTMLElement | null)?.tagName !== "INPUT")
            )
            .subscribe(() => this.#dropdownService.triggerPopupToggle$.next({}));
        fromEvent<KeyboardEvent>(host, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef), filter(usable))
            .subscribe(event => this.handleHostKeydown(event));
    }
}
