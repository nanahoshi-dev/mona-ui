import {
    Component,
    computed,
    contentChild,
    DestroyRef,
    forwardRef,
    inject,
    input,
    model,
    OnInit,
    output
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subject, tap } from "rxjs";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import {
    PopupMenuConfig,
    PopupMenuItemType,
    PopupMenuOrigin,
    PopupMenuShortcutTemplateToken,
    PopupMenuTextTemplateToken,
    PopupMenuToken,
    PopupMenuItem,
    PopupMenuItemClickEvent
} from "@nanahoshi/mona-ui/internal/popup-menu";

@Component({
    selector: "mona-popup-menu-checkbox-item",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => PopupMenuCheckboxItemComponent)
        }
    ]
})
export class PopupMenuCheckboxItemComponent implements PopupMenuConfig, OnInit {
    readonly #click$ = new Subject<PopupMenuItemClickEvent>();
    readonly #destroyRef = inject(DestroyRef);
    // One id per item for its lifetime, so the menu keeps track of it when the items are rebuilt.
    readonly #uid = createElementControlId();
    protected readonly shortcutTemplateConfig = contentChild(PopupMenuShortcutTemplateToken, {
        descendants: false
    });
    protected readonly textTemplateConfig = contentChild(PopupMenuTextTemplateToken, {
        descendants: false
    });

    /**
     * @description The checked state of the menu item. Activating the item toggles it (unless its `menuClick` is
     * prevented) and emits `checkedChange`, so it works with or without a two-way binding.
     */
    public readonly checked = model(false);

    /**
     * @description Sets the disabled state of the menu item.
     */
    public readonly disabled = input(false);

    /**
     * @description The text of the menu item.
     */
    public readonly label = input("");
    /**
     * @description The click event of the menu item.
     * Emits when the menu item is selected by keyboard or mouse.
     */
    public readonly menuClick = output<PopupMenuItemClickEvent>();
    public readonly origin: PopupMenuOrigin = PopupMenuOrigin.Popup;
    public readonly type = PopupMenuItemType.CheckboxMenuItem;

    /**
     * @description A value that identifies the item. It's the `value` of the item's `menuClick` events.
     */
    public readonly value = input<unknown>();

    public getPopupMenuItem(): PopupMenuItem[] {
        return [
            {
                checkable: true,
                checked: computed(() => this.checked()),
                click$: this.#click$,
                disabled: this.disabled(),
                group: Symbol(),
                groupTemplate: null,
                iconTemplate: null,
                items: [],
                label: this.label(),
                shortcutTemplate: computed(() => this.shortcutTemplateConfig()?.template ?? null),
                textTemplate: computed(() => this.textTemplateConfig()?.template ?? null),
                uid: this.#uid,
                value: computed(() => this.value())
            }
        ];
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    private setSubscriptions(): void {
        this.#click$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(e => {
                    this.menuClick.emit(e);
                    if (!e.isDefaultPrevented()) {
                        this.checked.set(e.checked === true);
                    }
                })
            )
            .subscribe();
    }
}
