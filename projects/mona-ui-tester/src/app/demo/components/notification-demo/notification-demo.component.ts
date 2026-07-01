import { NgComponentOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal,
    TemplateRef,
    viewChild,
    ViewContainerRef
} from "@angular/core";
import { ButtonDirective, NotificationRef, NotificationService, PlaceholderComponent, TextBoxComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-notification-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./notification-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDemoComponent extends AbstractDemoComponent<never> {
    readonly #injector = createFeatureInjector({
        notificationConfiguration: {
            active: true,
            name: "Notification Options",
            description: "Configure the notification component.",
            subFeatures: {
                appendTo: {
                    type: "dropdown",
                    active: false,
                    name: "Append To",
                    description: "The target element to append the notification to.",
                    dropdownDataSource: ["body", "scopedContainer"],
                    dropdownValue: "body"
                },
                closable: {
                    type: "boolean",
                    active: true,
                    name: "Closable",
                    description: "Whether the notification is closable."
                },
                closeTitle: {
                    type: "string",
                    active: true,
                    name: "Close Title",
                    description: "The title of the close button.",
                    stringValue: "Close"
                },
                content: {
                    type: "dropdown",
                    dropdownValue: "string",
                    dropdownDataSource: ["string", "template", "component"],
                    active: false,
                    name: "Content",
                    description: "The content of the notification."
                },
                contentText: {
                    type: "string",
                    active: false,
                    name: "Content Text",
                    description: "The text content of the notification.",
                    stringValue: "This is the notification message."
                },
                duration: {
                    type: "number",
                    active: true,
                    name: "Duration",
                    description: "The duration of the notification.",
                    numericNullable: true,
                    numericValue: 2000
                },
                height: {
                    type: "number",
                    active: true,
                    name: "Height",
                    description: "The height of the notification."
                },
                position: {
                    type: "dropdown",
                    dropdownValue: "topright",
                    dropdownDataSource: ["top", "topleft", "topright", "bottom", "bottomleft", "bottomright"],
                    active: true,
                    name: "Position",
                    description: "The position of the notification."
                },
                progressBar: {
                    type: "boolean",
                    active: true,
                    name: "Progress Bar",
                    description: "Show a progress bar for the notification."
                },
                title: {
                    type: "string",
                    active: true,
                    name: "Title",
                    description: "The title of the notification."
                },
                type: {
                    type: "dropdown",
                    dropdownValue: "success",
                    dropdownDataSource: ["success", "warning", "error", "info"],
                    active: true,
                    name: "Type",
                    description: "The type of the notification."
                },
                width: {
                    type: "number",
                    numericValue: undefined,
                    active: true,
                    name: "Width",
                    description: "The width of the notification."
                }
            }
        }
    });
    protected readonly config = signal<ComponentConfig<never>>({
        inputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly NotificationWrapperComponent = NotificationWrapperComponent;
}

@Component({
    imports: [ButtonDirective, PlaceholderComponent],
    template: `
        <button monaButton (click)="showNotification()">Show Notification</button>
        <button monaButton look="error" (click)="hideAll()">Hide All Notifications</button>
        <div #scopedContainer class="h-80 w-160 mt-4 p-1 relative overflow-hidden" style="border: 2px dashed #888;">
            <mona-placeholder>appendTo target</mona-placeholder>
        </div>
        <ng-template #contentTemplate>
            <div class="p-4">Custom Notification Content</div>
        </ng-template>
    `
})
class NotificationWrapperComponent implements ComponentInputsAsSignal<unknown> {
    readonly #config = computed(() => {
        const features = this.features();
        return features["notificationConfiguration"].subFeatures || {};
    });
    readonly #notificationService = inject(NotificationService);
    private readonly contentTemplate = viewChild.required<TemplateRef<unknown>>("contentTemplate");
    private readonly scopedContainer = viewChild.required("scopedContainer", { read: ViewContainerRef });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected notificationRef: NotificationRef | null = null;

    public showNotification() {
        const contentType = this.#config()["content"].dropdownValue;
        const content =
            contentType === "string"
                ? (this.#config()["contentText"].stringValue ?? "")
                : contentType === "template"
                  ? this.contentTemplate()
                  : NotificationPlaceholderComponent;
        const appendTo = this.#config()["appendTo"].dropdownValue === "body" ? undefined : this.scopedContainer();
        this.notificationRef = this.#notificationService.show({
            appendTo,
            closable: this.#config()["closable"].active,
            closeTitle: this.#config()["closeTitle"].stringValue,
            content,
            duration: this.#config()["duration"].numericValue,
            height: this.#config()["height"].numericValue,
            position: this.#config()["position"].dropdownValue,
            progressBar: this.#config()["progressBar"].active,
            title: this.#config()["title"].stringValue,
            type: this.#config()["type"].dropdownValue,
            width: this.#config()["width"].numericValue
        });
    }

    protected hideAll(): void {
        this.#notificationService.hideAll();
    }
}

@Component({
    imports: [PlaceholderComponent],
    template: ` <mona-placeholder [text]="'Notification Placeholder Component'" class="mt-4"></mona-placeholder> `
})
export class NotificationPlaceholderComponent {}
