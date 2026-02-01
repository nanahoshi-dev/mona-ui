import {
    afterNextRender,
    ChangeDetectionStrategy,
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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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

@Component({
    selector: "mona-button-group",
    templateUrl: "./button-group.component.html",
    providers: [ButtonService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()"
    }
})
export class ButtonGroupComponent implements ButtonGroupVariantsInput {
    readonly #buttonService = inject(ButtonService, { self: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const variantClasses = buttonGroupThemeVariants(theme)({ look, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClasses, userClass);
    });
    protected readonly buttons = contentChildren(ButtonDirective);

    /**
     * @description When set to false, at least one button must remain selected in single selection mode.
     * Clicking a selected button will not deselect it. Defaults to true (allows empty selection).
     */
    public readonly allowEmpty = input<boolean>(true);

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
        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    private setSubscriptions(): void {
        this.#buttonService.buttonClick$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(([button, wasSelected]) => {
                if (this.selection() === "single") {
                    // If allowEmpty is false and button is already selected, do nothing
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
