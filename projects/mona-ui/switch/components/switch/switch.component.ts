import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    inject,
    input,
    model,
    output,
    TemplateRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormCheckboxControl } from "@angular/forms/signals";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { filter, fromEvent, merge, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { SwitchHandleContentTemplateDirective } from "../../directives/switch-handle-content-template.directive";
import { SwitchOffLabelTemplateDirective } from "../../directives/switch-off-label-template.directive";
import { SwitchOnLabelTemplateDirective } from "../../directives/switch-on-label-template.directive";
import {
    switchHandleThemeVariants,
    switchLabelThemeVariants,
    switchThemeVariants,
    SwitchVariantInputs,
    SwitchVariantProps
} from "../../styles/switch.styles";

@Component({
    selector: "mona-switch",
    templateUrl: "./switch.component.html",
    styles: [
        `
            .mona-switch-label-enter {
                animation: mona-switch-label-fade-in 300ms ease-out;
            }

            .mona-switch-label-leave {
                animation: mona-switch-label-fade-out 300ms ease-out;
            }

            @keyframes mona-switch-label-fade-in {
                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }
            }

            @keyframes mona-switch-label-fade-out {
                from {
                    opacity: 1;
                }

                to {
                    opacity: 0;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .mona-switch-label-enter,
                .mona-switch-label-leave {
                    animation-duration: 1ms;
                }
            }
        `
    ],
    imports: [NgTemplateOutlet],
    host: {
        "[attr.role]": "'switch'",
        "[attr.aria-checked]": "checked()",
        "[attr.aria-disabled]": "disabled() || undefined",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-labelledby]": "ariaLabelledBy()",
        "[attr.tabindex]": "disabled() ? -1 : 0",
        "[attr.data-active]": "checked()",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[class]": "classes()",
        "(blur)": "onBlur()"
    }
})
export class SwitchComponent implements SwitchVariantInputs, FormCheckboxControl {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const classes = switchThemeVariants(theme)({ rounded, size });
        return twMerge(classes, this.userClass());
    });
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && !this.checked())
    );
    protected readonly handleClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const classes = switchHandleThemeVariants(theme)({ rounded, size });
        return twMerge(classes);
    });
    protected readonly handleContentTemplate = contentChild(SwitchHandleContentTemplateDirective, {
        read: TemplateRef
    });
    protected readonly labelClasses = computed(() => {
        const theme = this.#themeService.theme();
        const classes = switchLabelThemeVariants(theme)();
        return twMerge(classes);
    });
    protected readonly offLabelTemplate = contentChild(SwitchOffLabelTemplateDirective, { read: TemplateRef });
    protected readonly onLabelTemplate = contentChild(SwitchOnLabelTemplateDirective, { read: TemplateRef });

    /**
     * @description Accessible name for the host element. Describe what the component represents.
     * When empty, assistive technology announces the role without a label.
     * @default null
     */
    public readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the host element.
     * @default null
     */
    public readonly ariaLabelledBy = input<string | null>(null, { alias: "aria-labelledby" });

    /**
     * @description Whether the control is checked.
     * @default false
     */
    public readonly checked = model(false);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Marks the switch as invalid. When bound to a signal form field via `[field]`,
     * this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Label displayed inside the switch track when it is in the off state.
     * @default ""
     */
    public readonly offLabel = input("");

    /**
     * @description Label displayed inside the switch track when it is in the on state.
     * @default ""
     */
    public readonly onLabel = input("");

    /**
     * @description Marks the switch as required for form validation.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Border-radius preset applied to the component.
     * @default "full"
     */
    public readonly rounded = input<SwitchVariantProps["rounded"]>("full");

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<SwitchVariantProps["size"]>("medium");

    /**
     * @description Emitted when the switch loses focus or its value changes.
     */
    public readonly touch = output();

    /**
     * @description Marks the switch as touched. When bound to a signal form field via `[field]`,
     * this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        afterNextRender({
            read: () => this.#setEventListeners()
        });
    }

    protected onBlur(): void {
        this.touch.emit();
    }

    #setEventListeners(): void {
        const host = this.#hostElementRef.nativeElement;
        const click$ = fromEvent<MouseEvent>(host, "click");
        const keydown$ = fromEvent<KeyboardEvent>(host, "keydown").pipe(
            filter(event => event.key === " " || event.key === "Enter"),
            tap(event => event.preventDefault()) // Prevent page scroll on Space
        );
        merge(click$, keydown$)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.#toggleState());
    }

    #toggleState(): void {
        if (this.disabled()) {
            return;
        }
        this.checked.set(!this.checked());
        this.touch.emit();
    }
}
