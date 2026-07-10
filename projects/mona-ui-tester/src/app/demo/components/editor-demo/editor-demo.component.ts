import { NgComponentOutlet } from "@angular/common";
import { Component, computed, inject, input, signal } from "@angular/core";
import { EditorComponent, type EditorSettings } from "@nanahoshi/mona-ui/editor";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-editor-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./editor-demo.component.html"
})
export class EditorDemoComponent extends AbstractDemoComponent<EditorComponent> {
    readonly #injector = createFeatureInjector({
        alignment: {
            active: false,
            description: "Enable alignment buttons",
            name: "Alignment",
            type: "boolean"
        },
        blockquote: {
            active: false,
            description: "Enable blockquote button",
            name: "Blockquote",
            type: "boolean"
        },
        bold: {
            active: true,
            description: "Enable bold text button",
            name: "Bold",
            type: "boolean"
        },
        code: {
            active: false,
            description: "Enable code button",
            name: "Code",
            type: "boolean"
        },
        fontColor: {
            active: true,
            description: "Enable font color button",
            name: "Font Color",
            type: "boolean"
        },
        fontFamily: {
            active: false,
            description: "Enable font family button",
            name: "Font Family",
            type: "boolean"
        },
        fontHighlight: {
            active: false,
            description: "Enable font highlight button",
            name: "Font Highlight",
            type: "boolean"
        },
        fontList: {
            active: true,
            description: "Enable font list button",
            name: "Font List",
            type: "boolean"
        },
        fontSize: {
            active: false,
            description: "Enable font size button",
            name: "Font Size",
            type: "boolean"
        },
        headings: {
            active: true,
            description: "Enable headings button",
            name: "Headings",
            type: "boolean"
        },
        history: {
            active: false,
            description: "Enable history buttons",
            name: "History",
            type: "boolean"
        },
        horizontalRule: {
            active: false,
            description: "Enable horizontal rule button",
            name: "Horizontal Rule",
            type: "boolean"
        },
        image: {
            active: false,
            description: "Enable image button",
            name: "Image",
            type: "boolean"
        },
        indent: {
            active: false,
            description: "Enable indent button",
            name: "Indent",
            type: "boolean"
        },
        italic: {
            active: true,
            description: "Enable italic button",
            name: "Italic",
            type: "boolean"
        },
        link: {
            active: false,
            description: "Enable link button",
            name: "Link",
            type: "boolean"
        },
        list: {
            active: false,
            description: "Enable list button",
            name: "List",
            type: "boolean"
        },
        strikethrough: {
            active: false,
            description: "Enable strikethrough button",
            name: "Strikethrough",
            type: "boolean"
        },
        subscript: {
            active: false,
            description: "Enable subscript button",
            name: "Subscript",
            type: "boolean"
        },
        superscript: {
            active: false,
            description: "Enable superscript button",
            name: "Superscript",
            type: "boolean"
        },
        table: {
            active: false,
            description: "Enable table button",
            name: "Table",
            type: "boolean"
        },
        taskList: {
            active: false,
            description: "Enable task list button",
            name: "Task List",
            type: "boolean"
        },
        underline: {
            active: true,
            description: "Enable underline button",
            name: "Underline",
            type: "boolean"
        }
    });
    protected readonly EditorWrapperComponent = EditorWrapperComponent;
    protected readonly config = signal<ComponentConfig<EditorComponent>>({
        inputs: {
            content: {
                type: "string",
                value: ""
            },
            settings: {
                type: "object"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("EditorComponent");
}

@Component({
    imports: [EditorComponent],
    template: ` <mona-editor [content]="content()" [settings]="editorSettings()" class="w-full h-96"></mona-editor> `
})
class EditorWrapperComponent implements ComponentInputsAsSignal<EditorComponent> {
    readonly #features = inject(FeatureConfigHandler).data;
    protected readonly editorSettings = computed<EditorSettings>(() => {
        const features = this.#features();
        const settings: EditorSettings = {
            alignment: features["alignment"]?.active ?? false,
            blockquote: features["blockquote"]?.active ?? false,
            bold: features["bold"]?.active ?? false,
            code: features["code"]?.active ?? false,
            fontColor: features["fontColor"]?.active ?? false,
            fontFamily: features["fontFamily"]?.active ?? false,
            fontHighlight: features["fontHighlight"]?.active ?? false,
            fontList:
                (features["fontList"]?.active ?? false)
                    ? (["Arial", "Helvetica", "Times New Roman", "Verdana", "Courier New"] as const)
                    : [],
            fontSize: features["fontSize"]?.active ?? false,
            headings: features["headings"]?.active ?? false,
            history: features["history"]?.active ?? false,
            horizontalRule: features["horizontalRule"]?.active ?? false,
            image: features["image"]?.active ?? false,
            indent: features["indent"]?.active ?? false,
            italic: features["italic"]?.active ?? false,
            link: features["link"]?.active ?? false,
            list: features["list"]?.active ?? false,
            strikethrough: features["strikethrough"]?.active ?? false,
            subscript: features["subscript"]?.active ?? false,
            superscript: features["superscript"]?.active ?? false,
            table: features["table"]?.active ?? false,
            taskList: features["taskList"]?.active ?? false,
            underline: features["underline"]?.active ?? false
        };
        return settings;
    });

    public readonly content = input<ReturnType<EditorComponent["content"]>>("");
    public readonly settings = input<ReturnType<EditorComponent["settings"]>>(this.editorSettings());
}
