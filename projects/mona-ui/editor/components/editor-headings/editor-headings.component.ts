import { range } from "@mirei/ts-collections";
import { Component, computed, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownItemTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { HeadingsDropdownListDataItem, HeadingType } from "../../models/HeadingsDropdownListDataItem";
import { EditorService } from "../../services/editor.service";
import { editorHeadingsDropdownListThemeVariants } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-headings",
    imports: [DropdownListComponent, FormsModule, DropdownItemTemplateDirective],
    templateUrl: "./editor-headings.component.html"
})
export class EditorHeadingsComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly HeadingType = HeadingType;
    protected readonly dropdownListClass = computed(() => {
        return editorHeadingsDropdownListThemeVariants();
    });
    protected readonly headingsDropdownListData = computed<HeadingsDropdownListDataItem[]>(() => {
        const msgs = this.messages();
        return [
            { text: msgs.paragraph, value: HeadingType.Paragraph },
            ...range(1, 6)
                .select(level => ({
                    text: msgs.heading(level),
                    value: level as HeadingType
                }))
                .toArray()
        ];
    });
    protected readonly selectedHeadingsDropdownItem = computed(() => {
        const state = this.#editorService.state();
        const node = state.selection.$from.node();
        const data = this.headingsDropdownListData();
        if (node && node.type.name === "heading") {
            return data.find(item => item.value === node.attrs["level"]);
        }
        return data.find(item => item.value === HeadingType.Paragraph);
    });

    public onFormatChange(headingItem: HeadingsDropdownListDataItem | null | undefined): void {
        if (!headingItem) {
            return;
        }
        if (headingItem.value === HeadingType.Paragraph) {
            this.#editorService.editor.chain().focus().setParagraph().run();
        } else {
            this.#editorService.editor.chain().focus().setHeading({ level: headingItem.value }).run();
        }
    }
}
