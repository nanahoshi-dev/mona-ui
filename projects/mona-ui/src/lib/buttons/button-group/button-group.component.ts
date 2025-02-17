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
import { ButtonGroupItemComponent } from "mona-ui/buttons/button-group/button-group-item/button-group-item.component";
import {
    ButtonGroupVariantProps,
    buttonGroupVariants,
    ButtonGroupVariantsInput
} from "mona-ui/buttons/button-group/button-group.style";
import { ButtonVariantProps } from "mona-ui/buttons/button/button.style";
import { twMerge } from "tailwind-merge";
import { SelectionMode } from "../../models/SelectionMode";
import { ButtonDirective } from "../button/button.directive";
import { ButtonService } from "../services/button.service";

@Component({
    selector: "mona-button-group",
    templateUrl: "./button-group.component.html",
    providers: [ButtonService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [ButtonDirective, NgTemplateOutlet],
    host: {
        "[class]": "classes()",
        "[class.mona-button-group]": "true"
    }
})
export class ButtonGroupComponent implements OnInit, ButtonGroupVariantsInput {
    readonly #buttonService = inject(ButtonService, { self: true });
    readonly #destroyRef = inject(DestroyRef);
    protected readonly buttonLook = computed<ButtonVariantProps["look"]>(() => {
        return this.look() === "default" ? "ghost" : this.look();
    });
    protected readonly buttons = viewChildren(ButtonDirective);
    protected readonly classes = computed(() => {
        const look = this.look();
        const size = this.size();
        const userClass = this.userClass();
        const variantClasses = buttonGroupVariants({ look, size });
        return twMerge(variantClasses, userClass);
    });
    protected readonly items = contentChildren(ButtonGroupItemComponent);
    public readonly disabled = model<boolean>(false);
    public readonly look = input<ButtonGroupVariantProps["look"]>("outline");
    public readonly size = input<ButtonGroupVariantProps["size"]>("default");
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
