import { DestroyRef, Directive, effect, inject, input, OnInit, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { readonly } from "@angular/forms/signals";
import { Selector, sequenceEqual } from "@mirei/ts-collections";
import { pairwise } from "rxjs";
import { ExpandableOptions } from "@mirei/mona-ui/tree";
import { TreeService } from "@mirei/mona-ui/tree";

@Directive({
    selector: "mona-drop-down-tree[monaDropDownTreeExpandable]",
    standalone: true
})
export class DropDownTreeExpandableDirective<T> implements OnInit {
    readonly #defaultOptions: ExpandableOptions = {
        enabled: true
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #treeService: TreeService<T> = inject(TreeService);

    public readonly expandedKeysChange = output<unknown[]>();

    public expandBy = input<string | Selector<T, any> | null | undefined>();
    public expandedKeys = input<Iterable<unknown>>();
    public options = input<Partial<ExpandableOptions> | "">("", {
        alias: "monaDropDownTreeExpandable"
    });

    public constructor() {
        effect(() => {
            const expandBy = this.expandBy() ?? "";
            untracked(() => this.#treeService.setExpandBy(expandBy));
        });
        effect(() => {
            const expandedKeys = this.expandedKeys() ?? [];
            untracked(() => this.#treeService.setExpandedKeys(expandedKeys));
        });
        effect(() => {
            const options = this.options() ?? "";
            untracked(() => {
                if (options === "") {
                    this.#treeService.setExpandableOptions(this.#defaultOptions);
                } else {
                    this.#treeService.setExpandableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
    }

    public ngOnInit(): void {
        this.#treeService.expandedKeys$
            .pipe(pairwise(), takeUntilDestroyed(this.#destroyRef))
            .subscribe(([oldKeys, keys]) => {
                const orderedOldKeys = oldKeys.orderBy(k => k);
                const orderedKeys = keys.orderBy(k => k);
                if (sequenceEqual(orderedOldKeys, orderedKeys)) {
                    return;
                }
                this.expandedKeysChange.emit(keys.toArray());
            });
    }
}
