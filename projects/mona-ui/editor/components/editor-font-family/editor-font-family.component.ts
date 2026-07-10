import { Component, computed, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownItemTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { EditorService } from "../../services/editor.service";
import { editorFontFamilyDropdownListThemeVariants } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-font-family",
    imports: [DropdownListComponent, FormsModule, DropdownItemTemplateDirective],
    templateUrl: "./editor-font-family.component.html"
})
export class EditorFontFamilyComponent implements OnInit {
    readonly #themeService = inject(ThemeService);
    protected readonly dropdownListClass = computed(() => {
        const theme = this.#themeService.theme();
        return editorFontFamilyDropdownListThemeVariants(theme)();
    });
    protected readonly editorService: EditorService = inject(EditorService);
    protected readonly selectedFontFamily = computed(() => {
        this.editorService.state();
        return (
            this.editorService
                .fonts()
                .firstOrDefault(ff => this.editorService.editor.isActive("textStyle", { fontFamily: ff })) ?? null
        );
    });

    public ngOnInit(): void {
        const defaultFontFamily = this.editorService.fonts().first();
        this.editorService.editor.chain().focus().setFontFamily(defaultFontFamily).run();
    }

    public onFontFamilyChange(fontFamily: string | null | undefined): void {
        if (!fontFamily) {
            return;
        }
        this.editorService.editor.chain().focus().setFontFamily(fontFamily).run();
    }
}
