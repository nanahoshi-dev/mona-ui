import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    ElementRef,
    inject,
    input,
    isDevMode,
    viewChild
} from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId, MONA_LABEL } from "@nanahoshi/mona-ui/internal";
import type { MonaLabelContext, MonaLabelledControl } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { LABEL_DEFAULT_MESSAGES } from "../../i18n/label.default-messages";
import type { LabelTarget } from "../../models/LabelTarget";
import {
    labelCaptionThemeVariants,
    labelComponentThemeVariants,
    labelOptionalThemeVariants
} from "../../styles/label.styles";
import {
    focusLabelTarget,
    getLabelForAttribute,
    linkLabelTarget,
    warnIfTargetNotLabelable
} from "../../utils/label-association";

@Component({
    selector: "mona-label",
    template: `
        <label
            #label
            [attr.for]="forAttribute()"
            [attr.id]="labelElementId"
            [class]="classes()"
            [attr.data-optional]="optional() || null"
            (click)="onLabelClick($event)">
            @if (text() || optional()) {
                <span [attr.id]="captionElementId" [class]="captionClasses">
                    @if (text()) {
                        <span>{{ text() }}</span>
                    }
                    @if (optional()) {
                        <span [class]="optionalClasses">{{ optionalText() || messages().optional }}</span>
                    }
                </span>
            }
            <ng-content></ng-content>
        </label>
    `,
    providers: [{ provide: MONA_LABEL, useFactory: () => inject(LabelComponent).context }],
    host: {
        class: "inline-block"
    }
})
export class LabelComponent {
    readonly #i18n = inject(MonaI18nService);
    #wrappedControl: MonaLabelledControl | null = null;
    protected readonly captionClasses = labelCaptionThemeVariants();
    protected readonly captionElementId = createElementControlId();
    protected readonly classes = computed(() => twMerge(labelComponentThemeVariants(), this.userClass()));
    protected readonly forAttribute = computed(() => getLabelForAttribute(this.for()));
    protected readonly labelElementId = createElementControlId();
    protected readonly labelRef = viewChild.required<ElementRef<HTMLLabelElement>>("label");
    protected readonly messages = this.#i18n.componentMessages("label", LABEL_DEFAULT_MESSAGES);
    protected readonly optionalClasses = labelOptionalThemeVariants();

    /**
     * @internal
     */
    public readonly context: MonaLabelContext = {
        captionId: computed(() => (this.text() || this.optional() ? this.captionElementId : null)),
        register: control => {
            this.#wrappedControl = control;
            return () => {
                this.#wrappedControl = null;
            };
        }
    };
    /**
     * @description Associates the label with a native control ID or a target that exposes a public `focus()` method.
     * String values are reflected as the native `for` attribute. Object targets receive focus when the label is clicked.
     * @default undefined
     */
    public readonly for = input<LabelTarget>(undefined);

    /**
     * @description Whether to display optional-field text next to the caption.
     * @default false
     */
    public readonly optional = input(false, { transform: booleanAttribute });

    /**
     * @description Text displayed when `optional` is enabled.
     * @default the `label.optional` message
     */
    public readonly optionalText = input("");

    /**
     * @description Visible label caption text.
     * @default ""
     */
    public readonly text = input("");

    /**
     * @description Additional CSS classes merged onto the rendered `<label>` element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    public constructor() {
        // Without a caption of its own, the label's whole content is what names a control it points at.
        linkLabelTarget(
            () => this.for(),
            () => this.context.captionId() ?? this.labelElementId
        );
        afterNextRender(() => {
            if (isDevMode()) {
                this.#warnIfMisassociated();
            }
        });
    }

    #warnIfMisassociated(): void {
        warnIfTargetNotLabelable(this.for(), this.labelRef().nativeElement);
        if (this.#wrappedControl && !this.for() && !this.context.captionId() && !this.#wrappedControl.named()) {
            console.warn(
                "[Mona Label] A wrapped control takes its name from the text input. Text projected next to it can't " +
                    "name it.",
                this.labelRef().nativeElement
            );
        }
    }

    protected onLabelClick(event: MouseEvent): void {
        const wrapped = this.#wrappedControl;
        if (!wrapped || this.for()) {
            focusLabelTarget(this.for(), event);
            return;
        }
        if (event.defaultPrevented || (event.target instanceof Node && wrapped.element.contains(event.target))) {
            return;
        }
        // Cancels the browser's own activation, which would otherwise pick the first native input in the control.
        event.preventDefault();
        wrapped.activate();
    }
}
