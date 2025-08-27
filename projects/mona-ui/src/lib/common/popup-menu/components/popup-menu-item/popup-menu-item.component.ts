import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    forwardRef,
    inject,
    input,
    OnInit,
    output
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { selectMany } from "@mirei/ts-collections";
import { Subject, tap } from "rxjs";
import { v4 } from "uuid";
import {
    PopupMenuConfig,
    PopupMenuIconTemplateToken,
    PopupMenuItemType,
    PopupMenuOrigin,
    PopupMenuShortcutTemplateToken,
    PopupMenuTextTemplateToken,
    PopupMenuToken
} from "../../models/PopupMenuConfig";
import { PopupMenuItem } from "../../models/PopupMenuItem";
import { PopupMenuItemClickEvent } from "../../models/PopupMenuItemClickEvent";

@Component({
    selector: "mona-popup-menu-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => PopupMenuItemComponent)
        }
    ]
})
export class PopupMenuItemComponent implements PopupMenuConfig, OnInit {
    readonly #click$ = new Subject<PopupMenuItemClickEvent>();
    readonly #destroyRef = inject(DestroyRef);
    protected readonly iconTemplateConfig = contentChild(PopupMenuIconTemplateToken, {
        descendants: false
    });
    protected readonly items = contentChildren(PopupMenuToken, { descendants: false });
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
    public readonly type: PopupMenuItemType = PopupMenuItemType.MenuItem;

    public getPopupMenuItem(): PopupMenuItem[] {
        return [
            {
                click$: this.#click$,
                disabled: this.disabled(),
                group: Symbol(),
                groupTemplate: null,
                iconTemplate: computed(() => this.iconTemplateConfig()?.template ?? null),
                items: selectMany(
                    this.items().map(item => item.getPopupMenuItem()),
                    i => i
                ).toArray(),
                label: this.label(),
                shortcutTemplate: computed(() => this.shortcutTemplateConfig()?.template ?? null),
                textTemplate: computed(() => this.textTemplateConfig()?.template ?? null),
                uid: v4()
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
                tap(e => this.menuClick.emit(e))
            )
            .subscribe();
    }
}
