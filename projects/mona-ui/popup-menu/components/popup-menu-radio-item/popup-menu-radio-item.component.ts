import {
    ChangeDetectionStrategy,
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
import { v4 } from "uuid";
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
    changeDetection: ChangeDetectionStrategy.OnPush,
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
     * Emits when the menu item is selected by keyboard or mouse.
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
                disabled: this.disabled(),
                group: Symbol(),
                groupTemplate: null,
                iconTemplate: null,
                items: [],
                label: this.label(),
                radio: true,
                shortcutTemplate: computed(() => this.shortcutTemplateConfig()?.template ?? null),
                textTemplate: computed(() => this.textTemplateConfig()?.template ?? null),
                uid: v4(),
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
