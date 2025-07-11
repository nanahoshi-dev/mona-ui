import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    inject,
    input,
    model,
    OnInit,
    viewChildren
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstOrDefault } from "@mirei/ts-collections";

import { twMerge } from "tailwind-merge";
import { SelectionMode } from "../../../../models/SelectionMode";
import { ThemeService } from "../../../../theme/services/theme.service";
import { ButtonDirective } from "../../../button/directives/button.directive";
import { ButtonService } from "../../../services/button.service";
import {
    buttonGroupThemeVariants,
    ButtonGroupVariantProps,
    ButtonGroupVariantsInput
} from "../../styles/button-group.styles";
import { ButtonGroupItemComponent } from "../button-group-item/button-group-item.component";

@Component({
    selector: "mona-button-group",
    templateUrl: "./button-group.component.html",
    providers: [ButtonService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonDirective, NgTemplateOutlet],
    host: {
        "[class]": "classes()",
        "[class.mona-button-group]": "true"
    }
})
export class ButtonGroupComponent implements OnInit, ButtonGroupVariantsInput {
    readonly #buttonService = inject(ButtonService, { self: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #themeService = inject(ThemeService);
    protected readonly buttons = viewChildren(ButtonDirective);
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.userClass();
        const variantClasses = buttonGroupThemeVariants(theme)({ look, rounded, size });
        return twMerge(variantClasses, userClass);
    });
    protected readonly items = contentChildren(ButtonGroupItemComponent);

    /**
     * @description Sets the disabled state of the button group.
     * If true, all buttons in the group will be disabled.
     */
    public readonly disabled = model<boolean>(false);

    /**
     * @description Sets the look of the button group.
     */
    public readonly look = input<ButtonGroupVariantProps["look"]>("outline");

    /**
     * @description Sets the rounded style of the button group.
     */
    public readonly rounded = input<ButtonGroupVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the button group.
     */
    public readonly size = input<ButtonGroupVariantProps["size"]>("medium");

    /**
     * @description Sets the selection mode of the button group.
     */
    public readonly selection = model<SelectionMode>("multiple");
    public readonly userClass = input<string>("", { alias: "class" });

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    private setSubscriptions(): void {
        this.#buttonService.buttonClick$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(button => {
            if (this.selection() === "single") {
                const selectedButton = firstOrDefault(this.buttons(), b => b.selected());
                if (selectedButton === button) {
                    button.selected.set(!button.selected());
                    return;
                }
                this.buttons().forEach(b => {
                    this.#buttonService.buttonSelect$.next([b, b === button ? !b.selected() : false]);
                });
            } else {
                this.#buttonService.buttonSelect$.next([button, !button.selected()]);
            }
        });
        this.#buttonService.buttonSelected$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(button => {
            if (this.selection() === "single" && button.selected()) {
                this.buttons().forEach(b => {
                    if (b !== button) {
                        this.#buttonService.buttonSelect$.next([b, false]);
                    }
                });
            }
        });
    }
}
