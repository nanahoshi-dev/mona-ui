import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    forwardRef,
    inject,
    input,
    OnInit,
    signal,
    TemplateRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { SwitchHandleContentTemplateDirective } from "mona-ui/inputs/switch/directives/switch-handle-content-template.directive";
import {
    switchHandleThemeVariants,
    switchLabelThemeVariants,
    switchThemeVariants,
    SwitchVariantInputs,
    SwitchVariantProps
} from "mona-ui/inputs/switch/styles/switch.styles";
import { ThemeService } from "mona-ui/theme/services/theme.service";
import { filter, fromEvent, merge, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { FadeAnimation } from "../../../../animations/models/fade.animation";
import { Action } from "../../../../utils/Action";
import { SwitchOffLabelTemplateDirective } from "../../directives/switch-off-label-template.directive";
import { SwitchOnLabelTemplateDirective } from "../../directives/switch-on-label-template.directive";

@Component({
    selector: "mona-switch",
    templateUrl: "./switch.component.html",
    animations: [FadeAnimation()],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SwitchComponent),
            multi: true
        }
    ],
    imports: [NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.role]": "'switch'",
        "[attr.aria-checked]": "active()",
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.tabindex]": "disabled() ? -1 : 0",
        "[attr.data-active]": "active()",
        "[attr.data-disabled]": "disabled()",
        "[class]": "classes()",
        "(blur)": "onBlur()"
    }
})
export class SwitchComponent implements OnInit, ControlValueAccessor, SwitchVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<boolean> | null = null;
    #propagateTouched: Action | null = null;

    protected readonly active = signal(false);
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const classes = switchThemeVariants(theme)({ rounded, size });
        return twMerge(classes);
    });
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
     * @description Sets the disabled state of the switch.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the off label of the switch.
     */
    public readonly offLabel = input("");

    /**
     * @description Sets the on label of the switch.
     */
    public readonly onLabel = input("");

    /**
     * @description Sets the border radius of the switch.
     */
    public readonly rounded = input<SwitchVariantProps["rounded"]>("full");

    /**
     * @description Sets the size of the switch.
     */
    public readonly size = input<SwitchVariantProps["size"]>("medium");

    public ngOnInit(): void {
        this.setEventListeners();
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any) {
        this.#propagateTouched = fn;
    }

    public writeValue(obj: boolean): void {
        if (obj !== undefined) {
            this.active.set(obj);
        }
    }

    protected onBlur(): void {
        this.#propagateTouched?.();
    }

    private toggleState(): void {
        if (this.disabled()) {
            return;
        }
        this.active.set(!this.active());
        this.#propagateChange?.(this.active());
    }

    private setEventListeners(): void {
        const host = this.#hostElementRef.nativeElement;

        const click$ = fromEvent<MouseEvent>(host, "click");
        const keydown$ = fromEvent<KeyboardEvent>(host, "keydown").pipe(
            filter(event => event.key === " " || event.key === "Enter"),
            tap(event => event.preventDefault()) // Prevent page scroll on Space
        );

        merge(click$, keydown$)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.toggleState());
    }
}
