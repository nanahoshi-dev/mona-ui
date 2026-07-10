import {
    afterNextRender,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    effect,
    inject,
    input,
    model,
    untracked
} from "@angular/core";
import { outputFromObservable, takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { ButtonDirective, ButtonService } from "@nanahoshi/mona-ui/button";
import { SelectionMode } from "@nanahoshi/mona-ui/common";
import { ThemeService } from "@nanahoshi/mona-ui/theme";

import { map, pairwise } from "rxjs";
import { twMerge } from "tailwind-merge";
import {
    BUTTON_GROUP_STYLE_STRATEGY,
    ButtonGroupVariantProps,
    ButtonGroupVariantsInput
} from "../../styles/button-group.styles";

@Component({
    selector: "mona-button-group",
    templateUrl: "./button-group.component.html",
    providers: [ButtonService],
    host: {
        "[attr.aria-label]": "ariaLabel()",
        "[class]": "baseClass()",
        role: "group"
    }
})
export class ButtonGroupComponent implements ButtonGroupVariantsInput {
    readonly #buttonService = inject(ButtonService, { self: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #styleStrategy = inject(BUTTON_GROUP_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const variantClasses = this.#styleStrategy.resolve(theme)({ look, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClasses, userClass);
    });
    protected readonly buttons = contentChildren(ButtonDirective);

    /**
     * @description When `false` and `selection` is `"single"`, at least one button must remain selected;
     * the active button cannot be deselected. Has no effect in `"multiple"` mode.
     * @default true
     */
    public readonly allowEmpty = input<boolean>(true);

    /**
     * @description Accessible name for the host element. Override when multiple button groups appear on the same page
     * so screen reader users can distinguish them.
     * @default "Button group"
     */
    public readonly ariaLabel = input("Button group", { alias: "aria-label" });

    /**
     * @description Emitted when any child button in the group is clicked.
     * Use `[(selected)]` on child buttons to observe the resulting selection state.
     */
    public readonly buttonClick = outputFromObservable(
        this.#buttonService.buttonClick$.pipe(
            map(() => undefined as void),
            takeUntilDestroyed(this.#destroyRef)
        )
    );

    /**
     * @description Renders all child buttons with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = model<boolean>(false);

    /**
     * @description Visual style variant propagated to all child buttons.
     * Also controls container-level divider and border behavior.
     * @default "outline"
     */
    public readonly look = input<ButtonGroupVariantProps["look"]>("outline");

    /**
     * @description Border-radius preset applied to the container and the outer corners of the first and last child button.
     * @default "medium"
     */
    public readonly rounded = input<ButtonGroupVariantProps["rounded"]>("medium");

    /**
     * @description Two-way bindable. Controls whether child buttons behave as a radio group (`"single"`)
     * or toggle independently (`"multiple"`).
     * @default "multiple"
     */
    public readonly selection = model<SelectionMode>("multiple");

    /**
     * @description Size preset propagated to all child buttons, overriding their individual `size` inputs.
     * @default "medium"
     */
    public readonly size = input<ButtonGroupVariantProps["size"]>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        effect(() => {
            const disabled = this.disabled();
            untracked(() => this.#buttonService.groupDisabled.set(disabled));
        });
        effect(() => {
            const look = this.look();
            untracked(() => this.#buttonService.groupLook.set(look));
        });
        effect(() => {
            const rounded = this.rounded();
            untracked(() => this.#buttonService.groupRounded.set(rounded));
        });
        effect(() => {
            const size = this.size();
            untracked(() => this.#buttonService.groupSize.set(size));
        });
        toObservable(this.selection)
            .pipe(pairwise(), takeUntilDestroyed(this.#destroyRef))
            .subscribe(([prev, curr]) => {
                if (prev === "multiple" && curr === "single") {
                    const selected = this.buttons().filter(b => b.selected());
                    selected.slice(1).forEach(b => {
                        this.#buttonService.buttonSelect$.next([b, false]);
                    });
                }
            });
        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    private setSubscriptions(): void {
        this.#buttonService.buttonClick$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(([button, wasSelected]) => {
                if (this.selection() === "single") {
                    if (wasSelected && !this.allowEmpty()) {
                        return;
                    }
                    this.buttons().forEach(b => {
                        if (b.selected()) {
                            this.#buttonService.buttonSelect$.next([b, false]);
                        }
                    });
                    if (!wasSelected) {
                        this.#buttonService.buttonSelect$.next([button, true]);
                    }
                } else {
                    this.#buttonService.buttonSelect$.next([button, !wasSelected]);
                }
            });
    }
}
