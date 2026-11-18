import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, inject, input, signal } from "@angular/core";
import {
    EditorComponent,
    type EditorMention,
    type EditorMentionSearch,
    type EditorSettings
} from "@nanahoshi/mona-ui/editor";
import type { FileUploadHandler } from "@nanahoshi/mona-ui/file-upload";
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
            active: true,
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
            active: true,
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
            active: false,
            description: "Enable custom font list",
            name: "Custom Font List",
            type: "boolean"
        },
        fontSize: {
            active: true,
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
        mention: {
            active: true,
            description: "Offer mentions as @ is typed",
            name: "Mentions",
            type: "boolean"
        },
        strikethrough: {
            active: true,
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
    protected readonly config = signal<ComponentConfig<EditorComponent>>({
        inputs: {
            characterLimit: {
                type: "number",
                nullable: true,
                min: 1,
                value: null
            },
            disabled: {
                type: "boolean",
                value: false
            },
            readonly: {
                type: "boolean",
                value: false
            },
            required: {
                type: "boolean",
                value: false
            },
            settings: {
                type: "object"
            },
            showCharacterCount: {
                type: "boolean",
                value: false
            },
            showWordCount: {
                type: "boolean",
                value: false
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("EditorComponent");
    protected readonly wrapperComponent = EditorWrapperComponent;
}

const DEMO_PEOPLE: readonly EditorMention[] = [
    { id: "1", label: "Ana Lima" },
    { id: "2", label: "Bo Chen" },
    { id: "3", label: "Chidi Okafor" },
    { id: "4", label: "Dana Weiss" }
];

@Component({
    imports: [EditorComponent],
    template: `
        <mona-editor
            [(value)]="html"
            [settings]="editorSettings()"
            [characterLimit]="characterLimit()"
            [imageUpload]="uploadImage"
            [mentionSearch]="searchMentions"
            [showCharacterCount]="showCharacterCount()"
            [showWordCount]="showWordCount()"
            [disabled]="disabled()"
            [readonly]="readonly()"
            [required]="required()"
            [touched]="editorTouched()"
            (touch)="editorTouched.set(true)"
            class="w-full h-96"></mona-editor>
        <details class="mt-2">
            <summary>HTML value</summary>
            <pre class="text-xs whitespace-pre-wrap">{{ html() }}</pre>
        </details>
    `
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
            fontSizeList: [],
            headings: features["headings"]?.active ?? false,
            history: features["history"]?.active ?? false,
            horizontalRule: features["horizontalRule"]?.active ?? false,
            image: features["image"]?.active ?? false,
            indent: features["indent"]?.active ?? false,
            italic: features["italic"]?.active ?? false,
            link: features["link"]?.active ?? false,
            list: features["list"]?.active ?? false,
            mention: features["mention"]?.active ?? false,
            strikethrough: features["strikethrough"]?.active ?? false,
            subscript: features["subscript"]?.active ?? false,
            superscript: features["superscript"]?.active ?? false,
            table: features["table"]?.active ?? false,
            taskList: features["taskList"]?.active ?? false,
            underline: features["underline"]?.active ?? false
        };
        return settings;
    });
    protected readonly editorTouched = signal(false);
    protected readonly html = signal("<p>Hello, <strong>Mona</strong>!</p>");
    public readonly characterLimit = input<number | null>(null);
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly settings = input<ReturnType<EditorComponent["settings"]>>(this.editorSettings());
    public readonly showCharacterCount = input(false, { transform: booleanAttribute });
    public readonly showWordCount = input(false, { transform: booleanAttribute });

    protected readonly searchMentions: EditorMentionSearch = query =>
        DEMO_PEOPLE.filter(person => person.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

    /** Stands in for a server: it takes about a second, and returns an address the page can show. */
    protected readonly uploadImage: FileUploadHandler = (file, { progress, signal: abort }) =>
        new Promise<string>((resolve, reject) => {
            let step = 0;
            const timer = setInterval(() => {
                progress(++step, 5);
                if (step === 5) {
                    clearInterval(timer);
                    resolve(URL.createObjectURL(file));
                }
            }, 200);
            abort.addEventListener("abort", () => {
                clearInterval(timer);
                reject(abort.reason);
            });
        });
}
