import {
    Component,
    computed,
    contentChild,
    DestroyRef,
    forwardRef,
    inject,
    input,
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
    PopupMenuRadioItemToken,
    PopupMenuShortcutTemplateToken,
    PopupMenuTextTemplateToken,
    PopupMenuToken
} from "../../models/PopupMenuConfig";
import { PopupMenuItem } from "../../models/PopupMenuItem";
import { PopupMenuItemClickEvent } from "../../models/PopupMenuItemClickEvent";

@Component({
    selector: "mona-popup-menu-radio-item",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => PopupMenuRadioItemComponent)
        },
        {
            provide: PopupMenuRadioItemToken,
            useExisting: forwardRef(() => PopupMenuRadioItemComponent)
        }
    ]
})
export class PopupMenuRadioItemComponent implements PopupMenuConfig, OnInit {
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
     * @description Sets the disabled state of the menu item.
     */
    public readonly disabled = input(false);

    /**
     * @description The text of the menu item.
     */
    public readonly label = input("");

    /**
     * @description The click event of the menu item.
     * Emits when the menu item is selected by keyboard or mouse, before the radio group selects it. Preventing it
     * keeps the group's value and the menu open.
     */
    public readonly menuClick = output<PopupMenuItemClickEvent>();
    public readonly origin: PopupMenuOrigin = PopupMenuOrigin.Popup;
    public readonly type = PopupMenuItemType.RadioItem;

    /**
     * @description The value of the radio item.
     */
    public readonly value = input.required<string>();
    public getPopupMenuItem(): PopupMenuItem[] {
        return [
            {
                click$: this.#click$,
                disabled: this.disabled(),
                group: Symbol(),
                groupTemplate: null,
                iconTemplate: null,
                items: [],
                label: this.label(),
                radio: true,
                shortcutTemplate: computed(() => this.shortcutTemplateConfig()?.template ?? null),
                textTemplate: computed(() => this.textTemplateConfig()?.template ?? null),
                uid: this.#uid,
                value: computed(() => this.value())
            }
        ];
    }

    public ngOnInit(): void {
        this.setSubscription();
    }

    private setSubscription(): void {
        this.#click$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(e => this.menuClick.emit(e))
            )
            .subscribe();
    }
}
