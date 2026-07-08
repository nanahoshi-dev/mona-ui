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
    PopupMenuToken
} from "../../models/PopupMenuConfig";
import { PopupMenuItem } from "../../models/PopupMenuItem";
import { PopupMenuItemClickEvent } from "../../models/PopupMenuItemClickEvent";

@Component({
    selector: "mona-popup-menu-radio-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
        const menuItems = this.items().map(i =>
            i.getPopupMenuItem().map<PopupMenuItem>(item => ({
                ...item,
                click$: this.#click$,
                group: this.title() || Symbol(),
                groupTemplate: computed(() => this.groupTemplateConfig()?.template ?? null),
                radio: true,
                selected: computed(() => item.value?.() === this.value())
            }))
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
                    if (event.isDefaultPrevented()) {
                        return;
                    }
                    const value = event.item.value?.();
                    if (value != null) {
                        this.value.set(value);
                    }
                })
            )
            .subscribe();
    }
}
