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
import { switchHandleVariants, switchLabelVariants, switchVariants } from "mona-ui/inputs/styles/switch.style";
import { fromEvent } from "rxjs";
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
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.data-disabled]": "disabled()",
        "[class]": "classes()"
    }
})
export class SwitchComponent implements OnInit, ControlValueAccessor {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    #propagateChange: Action<boolean> | null = null;

    protected readonly active = signal(false);
    protected readonly classes = computed(() => {
        const active = this.active();
        const state = active ? "on" : "off";
        const classes = switchVariants({ state });
        return twMerge(classes);
    });
    protected readonly handleClasses = computed(() => {
        const active = this.active();
        const state = active ? "on" : "off";
        const classes = switchHandleVariants({ state });
        return twMerge(classes);
    });
    protected readonly labelClasses = computed(() => {
        const classes = switchLabelVariants();
        return twMerge(classes);
    });
    protected readonly offLabelTemplate = contentChild(SwitchOffLabelTemplateDirective, { read: TemplateRef });
    protected readonly onLabelTemplate = contentChild(SwitchOnLabelTemplateDirective, { read: TemplateRef });

    public readonly disabled = input(false);
    public readonly labelOff = input("");
    public readonly labelOn = input("");

    public ngOnInit(): void {
        this.setEventListeners();
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any) {
        void 0;
    }

    public writeValue(obj: boolean): void {
        if (obj !== undefined) {
            this.active.set(obj);
        }
    }

    private setEventListeners(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.active.set(!this.active());
                this.#propagateChange?.(this.active());
            });
    }
}
