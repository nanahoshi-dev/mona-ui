import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal, TemplateRef, viewChild } from "@angular/core";
import { LucideFileXCorner } from "@lucide/angular";
import { CheckBoxComponent } from "mona-ui/check-box";
import { TextBoxComponent, TextBoxDirective } from "mona-ui/text-box";
import { ButtonDirective } from "mona-ui/button";
import {
    DialogAction,
    DialogActionEvent,
    DialogComponent,
    DialogContentTemplateDirective,
    DialogDescriptionTemplateDirective,
    DialogFooterTemplateDirective,
    DialogIconTemplateDirective,
    DialogRef,
    DialogService,
    DialogTitleTemplateDirective,
    PopupCloseEvent
} from "mona-ui/dialog";
import { take } from "rxjs";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-dialog-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./dialog-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogDemoComponent extends AbstractDemoComponent<DialogComponent> {
    readonly #actions = [
        {
            text: "Save/Delete/Cancel",
            value: [
                { look: "primary", text: "Save" },
                { look: "error", text: "Delete" },
                { look: "default", text: "Cancel" }
            ] as DialogAction[]
        },
        {
            text: "Cancel/Confirm",
            value: [
                { look: "default", text: "Cancel" },
                { look: "primary", text: "Confirm" }
            ] as DialogAction[]
        },
        {
            text: "No Action",
            value: []
        }
    ];
    readonly #injector = createFeatureInjector({
        contentTemplate: {
            code: ``,
            active: false,
            name: "Content Template",
            description: "Customize the content of the dialog."
        },
        descriptionTemplate: {
            code: ``,
            active: false,
            name: "Description Template",
            description: "Customize the description of the dialog."
        },
        dynamicDialogContentTemplate: {
            code: ``,
            active: false,
            name: "Dynamic Content Template",
            description: "Customize the content of the dialog opened by dialog service."
        },
        footerTemplate: {
            code: ``,
            active: false,
            name: "Footer Template",
            description: "Customize the footer of the dialog."
        },
        iconTemplate: {
            code: ``,
            active: false,
            name: "Icon Template",
            description: "Customize the icon of the dialog."
        },
        titleTemplate: {
            code: ``,
            active: false,
            name: "Title Template",
            description: "Customize the title of the dialog."
        }
    });
    protected readonly config = signal<ComponentConfig<DialogComponent>>({
        inputs: {
            actions: {
                type: "customDropdown",
                value: this.#actions,
                textField: "text",
                valueField: "value",
                defaultValue: undefined
            },
            actionsLayout: {
                type: "dropdown",
                value: ["start", "center", "end", "stretched"],
                defaultValue: "end"
            },
            closable: {
                type: "boolean",
                value: true
            },
            closeOnEscape: {
                type: "boolean",
                value: true
            },
            description: {
                type: "string",
                value: "Make changes to your profile here. Click save when you're done."
            },
            focusedElement: {
                type: "string",
                value: ""
            },
            height: {
                type: "number",
                value: undefined
            },
            left: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            },
            maxHeight: {
                type: "number",
                value: undefined
            },
            maxWidth: {
                type: "number",
                value: undefined
            },
            minHeight: {
                type: "number",
                value: undefined
            },
            minWidth: {
                type: "number",
                value: undefined
            },
            modal: {
                type: "boolean",
                value: true
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "medium"
            },
            text: {
                type: "string",
                value: "Dialog text will appear here."
            },
            title: {
                type: "string",
                value: "Edit Content"
            },
            top: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            },
            type: {
                type: "dropdown",
                value: ["info", "success", "warning", "error", "confirm"],
                defaultValue: "info",
                clearable: true
            },
            width: {
                type: "number",
                value: 400
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("DialogComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly DialogWrapperComponent = DialogWrapperComponent;
}

@Component({
    imports: [
        DialogComponent,
        ButtonDirective,
        DialogTitleTemplateDirective,
        DialogFooterTemplateDirective,
        CheckBoxComponent,
        DialogDescriptionTemplateDirective,
        DialogIconTemplateDirective,
        DialogContentTemplateDirective,
        TextBoxComponent,
        TextBoxDirective,
        LucideFileXCorner
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <button monaButton look="primary" (click)="dialogVisible.set(true)">Open</button>
        <button monaButton look="primary" (click)="openDialog()">Open via Dialog Service</button>
        @if (dialogVisible()) {
            <mona-dialog
                (action)="onAction($event)"
                [actions]="actions()"
                [actionsLayout]="actionsLayout()"
                (close)="onClose($event)"
                (closed)="onClosed()"
                [closable]="closable()"
                [closeOnEscape]="closeOnEscape()"
                [description]="description()"
                [focusedElement]="focusedElement()"
                [height]="height()"
                [left]="left()"
                [maxHeight]="maxHeight()"
                [maxWidth]="maxWidth()"
                [minHeight]="minHeight()"
                [minWidth]="minWidth()"
                [modal]="modal()"
                [rounded]="rounded()"
                [text]="text()"
                [title]="title()"
                [top]="top()"
                [type]="type()"
                [width]="width()">
                @if (featureData["contentTemplate"].active) {
                    <ng-template monaDialogContentTemplate>
                        <div class="flex flex-col gap-2">
                            <mona-text-box [placeholder]="'Enter your email...'" type="email"></mona-text-box>
                            <input
                                type="password"
                                placeholder="Enter your password..."
                                class="dialog-password"
                                monaTextBox />
                        </div>
                    </ng-template>
                }
                @if (featureData["descriptionTemplate"].active) {
                    <ng-template monaDialogDescriptionTemplate>
                        <p class="text-sm text-rose-500">{{ description() }}</p>
                    </ng-template>
                }
                @if (featureData["footerTemplate"].active) {
                    <ng-template monaDialogFooterTemplate>
                        <div class="flex gap-2 flex-row items-center pl-6 pr-4 py-2">
                            <mona-check-box [label]="'Do not show again'" class="flex-1 text-sm"></mona-check-box>
                            <button monaButton look="primary" (click)="dialogVisible.set(false)">OK</button>
                            <button monaButton (click)="dialogVisible.set(false)">Cancel</button>
                        </div>
                    </ng-template>
                }
                @if (featureData["iconTemplate"].active) {
                    <ng-template monaDialogIconTemplate>
                        <svg lucideFileXCorner [size]="32"></svg>
                    </ng-template>
                }
                @if (featureData["titleTemplate"].active) {
                    <ng-template monaDialogTitleTemplate>
                        <h2 class="text-violet-600 italic">Custom Title</h2>
                    </ng-template>
                }
            </mona-dialog>
        }

        @if (featureData["dynamicDialogContentTemplate"].active) {
            <ng-template #dynamicDialogContentTemplate>
                <div class="flex flex-col gap-2 items-center">
                    <p>Dynamic content goes here</p>
                    <button monaButton look="error" (click)="dynamicDialogRef?.close()">Close Dialog</button>
                </div>
            </ng-template>
        }
    `
})
class DialogWrapperComponent implements ComponentInputsAsSignal<DialogComponent> {
    readonly #dialogService = inject(DialogService);
    private readonly dynamicDialogContent = viewChild<TemplateRef<unknown>>("dynamicDialogContentTemplate");
    protected readonly dialogVisible = signal(false);
    protected readonly features = inject(FeatureConfigHandler).data;
    protected dynamicDialogRef: DialogRef | null = null;
    public readonly actions = input<ReturnType<DialogComponent["actions"]>>([]);
    public readonly actionsLayout = input<ReturnType<DialogComponent["actionsLayout"]>>("end");
    public readonly closable = input<ReturnType<DialogComponent["closable"]>>(true);
    public readonly closeOnEscape = input<ReturnType<DialogComponent["closeOnEscape"]>>(true);
    public readonly description = input<ReturnType<DialogComponent["description"]>>("");
    public readonly focusedElement = input<ReturnType<DialogComponent["focusedElement"]>>("");
    public readonly height = input<ReturnType<DialogComponent["height"]>>(135);
    public readonly maxHeight = input<ReturnType<DialogComponent["maxHeight"]>>();
    public readonly maxWidth = input<ReturnType<DialogComponent["maxWidth"]>>();
    public readonly minHeight = input<ReturnType<DialogComponent["minHeight"]>>();
    public readonly minWidth = input<ReturnType<DialogComponent["minWidth"]>>();
    public readonly left = input<ReturnType<DialogComponent["left"]>>();
    public readonly modal = input<ReturnType<DialogComponent["modal"]>>(true);
    public readonly rounded = input<ReturnType<DialogComponent["rounded"]>>("medium");
    public readonly text = input<ReturnType<DialogComponent["text"]>>("");
    public readonly title = input<ReturnType<DialogComponent["title"]>>("");
    public readonly top = input<ReturnType<DialogComponent["top"]>>();
    public readonly type = input<ReturnType<DialogComponent["type"]>>("info");
    public readonly width = input<ReturnType<DialogComponent["width"]>>(300);

    protected onAction(event: DialogActionEvent): void {
        console.log("Dialog result:", event.action);
        // this.dialogVisible.set(false);
    }

    protected onClose(event: PopupCloseEvent): void {
        console.log("Dialog is about to close");
        // event.preventDefault();
        this.dialogVisible.set(false);
    }

    protected onClosed(): void {
        console.log("Dialog closed");
    }

    protected openDialog(): void {
        this.dynamicDialogRef = this.#dialogService.show({
            actions: this.actions(),
            actionsLayout: this.actionsLayout(),
            closable: this.closable(),
            closeOnEscape: this.closeOnEscape(),
            content: this.dynamicDialogContent(),
            description: this.description(),
            focusedElement: this.focusedElement(),
            height: this.height(),
            left: this.left(),
            maxHeight: this.maxHeight(),
            maxWidth: this.maxWidth(),
            minHeight: this.minHeight(),
            minWidth: this.minWidth(),
            modal: this.modal(),
            rounded: this.rounded(),
            text: `${this.text()} Display content template in Features tab.`,
            title: `${this.title()} - Dynamic`,
            top: this.top(),
            type: this.type(),
            width: this.width()
        });
        this.dynamicDialogRef.result.pipe(take(1)).subscribe(result => {
            console.log("Dialog result:", result);
            this.dynamicDialogRef?.close();
        });
    }
}
