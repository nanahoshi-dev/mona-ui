import { Component, computed, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownItemTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { HeadingsDropdownListDataItem, HeadingType } from "../../models/HeadingsDropdownListDataItem";
import { EditorService } from "../../services/editor.service";
import { EDITOR_STYLE_STRATEGY } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-headings",
    imports: [DropdownListComponent, FormsModule, DropdownItemTemplateDirective],
    templateUrl: "./editor-headings.component.html"
})
export class EditorHeadingsComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #styleStrategy = inject(EDITOR_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly HeadingType = HeadingType;
    protected readonly dropdownListClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).headingsDropdownList();
    });
    protected readonly headingsDropdownListData = [
        { text: "Paragraph", value: HeadingType.Paragraph },
        { text: "Heading 1", value: HeadingType.Heading1 },
        { text: "Heading 2", value: HeadingType.Heading2 },
        { text: "Heading 3", value: HeadingType.Heading3 },
        { text: "Heading 4", value: HeadingType.Heading4 },
        { text: "Heading 5", value: HeadingType.Heading5 },
        { text: "Heading 6", value: HeadingType.Heading6 }
    ];
    protected readonly selectedHeadingsDropdownItem = computed(() => {
        const state = this.#editorService.state();
        const node = state.selection.$from.node();
        if (node && node.type.name === "heading") {
            return this.headingsDropdownListData.find(item => item.value === node.attrs["level"]);
        }
        return this.headingsDropdownListData.find(item => item.value === HeadingType.Paragraph);
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
