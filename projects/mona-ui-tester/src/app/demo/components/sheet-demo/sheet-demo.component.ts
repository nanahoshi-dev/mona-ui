import { NgComponentOutlet } from "@angular/common";
import { Component, computed, input, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { SheetComponent } from "@nanahoshi/mona-ui/sheet";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-sheet-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./sheet-demo.component.html"
})
export class SheetDemoComponent extends AbstractDemoComponent<SheetComponent> {
    readonly #injector = createFeatureInjector({});
    protected readonly config = signal<ComponentConfig<SheetComponent>>({
        inputs: {
            closable: {
                type: "boolean",
                value: true
            },
            closeOnBackdropClick: {
                type: "boolean",
                value: true
            },
            closeOnEscape: {
                type: "boolean",
                value: true
            },
            height: {
                type: "string",
                value: ""
            },
            side: {
                type: "dropdown",
                value: ["top", "right", "bottom", "left"],
                defaultValue: "right"
            },
            width: {
                type: "string",
                value: ""
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SheetComponent");
    protected readonly SheetWrapperComponent = SheetWrapperComponent;
}

@Component({
    imports: [ButtonDirective, SheetComponent, TextBoxDirective, LabelComponent],
    template: `
        <button monaButton look="primary" type="button" (click)="visible.set(true)">Open sheet</button>

        @if (visible()) {
            <mona-sheet
                [side]="side()"
                title="Mobile settings"
                description="This long form demonstrates independent sheet scrolling."
                [closable]="closable()"
                [closeOnEscape]="closeOnEscape()"
                [closeOnBackdropClick]="closeOnBackdropClick()"
                [width]="resolvedWidth()"
                [height]="resolvedHeight()"
                (closed)="visible.set(false)">
                <form class="flex flex-col gap-4" (submit)="$event.preventDefault()">
                    @for (field of fields; track field) {
                        <mona-label class="w-full">
                            {{ field }}
                            <input
                                monaTextBox
                                [name]="field"
                                [placeholder]="'Enter ' + field.toLowerCase()"
                                class="w-full" />
                        </mona-label>
                    }
                    <div class="flex justify-end gap-2 pt-2">
                        <button monaButton type="button" (click)="visible.set(false)">Cancel</button>
                        <button monaButton look="primary" type="submit">Save changes</button>
                    </div>
                </form>
            </mona-sheet>
        }
    `
})
class SheetWrapperComponent implements ComponentInputsAsSignal<SheetComponent> {
    protected readonly fields = [
        "Display name",
        "Email",
        "Phone",
        "Company",
        "Role",
        "Address",
        "City",
        "Country",
        "Postal code"
    ];
    protected readonly resolvedWidth = computed(() => this.width() || undefined);
    protected readonly resolvedHeight = computed(() => this.height() || undefined);
    protected readonly visible = signal(false);
    public readonly closable = input<ReturnType<SheetComponent["closable"]>>(true);
    public readonly closeOnBackdropClick = input<ReturnType<SheetComponent["closeOnBackdropClick"]>>(true);
    public readonly closeOnEscape = input<ReturnType<SheetComponent["closeOnEscape"]>>(true);
    public readonly height = input<ReturnType<SheetComponent["height"]>>("");
    public readonly side = input<ReturnType<SheetComponent["side"]>>("right");
    public readonly width = input<ReturnType<SheetComponent["width"]>>("");
}
