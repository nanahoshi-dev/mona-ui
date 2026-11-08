import {
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    forwardRef,
    inject,
    input,
    model,
    OnInit
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { selectMany } from "@mirei/ts-collections";
import { filter, Subject, tap } from "rxjs";
import {
    PopupMenuConfig,
    PopupMenuGroupTemplateToken,
    PopupMenuItemType,
    PopupMenuOrigin,
    PopupMenuRadioItemToken,
    PopupMenuToken,
    PopupMenuItem,
    PopupMenuItemClickEvent
} from "@nanahoshi/mona-ui/internal/popup-menu";

@Component({
    selector: "mona-popup-menu-radio-group",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => PopupMenuRadioGroupComponent)
        }
    ]
})
export class PopupMenuRadioGroupComponent implements PopupMenuConfig, OnInit {
    readonly #click$ = new Subject<PopupMenuItemClickEvent>();
    readonly #destroyRef = inject(DestroyRef);
    // One key per group: consecutive items with it form the group, and its description is the title.
    readonly #groupKey = computed(() => Symbol(this.title()));
    // The radio items' own click subjects, so their `menuClick` runs before the group selects.
    readonly #itemClicks = new WeakMap<PopupMenuItem, Subject<PopupMenuItemClickEvent>>();
    protected readonly groupTemplateConfig = contentChild(PopupMenuGroupTemplateToken, {
        descendants: false
    });
    protected readonly items = contentChildren(PopupMenuRadioItemToken, { descendants: false });
    public readonly origin: PopupMenuOrigin = PopupMenuOrigin.Popup;

    /**
     * @description The title of the radio group.
     */
    public readonly title = input("");
    public readonly type = PopupMenuItemType.RadioGroup;

    /**
     * @description The value of the selected radio item.
     */
    public readonly value = model<string>("");

    public getPopupMenuItem(): PopupMenuItem[] {
        const group = this.#groupKey();
        const menuItems = this.items().map(i =>
            i.getPopupMenuItem().map<PopupMenuItem>(item => {
                const groupItem: PopupMenuItem = {
                    ...item,
                    click$: this.#click$,
                    group,
                    groupTemplate: computed(() => this.groupTemplateConfig()?.template ?? null),
                    radio: true,
                    selected: computed(() => item.value?.() === this.value())
                };
                if (item.click$) {
                    this.#itemClicks.set(groupItem, item.click$);
                }
                return groupItem;
            })
        );
        return selectMany(menuItems, i => i).toArray();
    }

    public ngOnInit(): void {
        this.setSubscription();
    }

    private setSubscription(): void {
        this.#click$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(e => e.item.radio == true),
                tap(event => {
                    this.#itemClicks.get(event.item)?.next(event);
                    if (event.isDefaultPrevented()) {
                        return;
                    }
                    const value = event.item.value?.();
                    if (typeof value === "string") {
                        this.value.set(value);
                    }
                })
            )
            .subscribe();
    }
}
