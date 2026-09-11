import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import { describe, expect, it } from "vitest";
import { EditorImageInserterComponent } from "../components/editor-image-inserter/editor-image-inserter.component";
import { EditorTaskListComponent } from "../components/editor-task-list/editor-task-list.component";
import { EditorTextAlignmentsComponent } from "../components/editor-text-alignments/editor-text-alignments.component";
import { EditorService } from "../services/editor.service";

@Component({
    template: `
        <mona-editor-text-alignments></mona-editor-text-alignments>
        <mona-editor-task-list></mona-editor-task-list>
        <mona-editor-image-inserter></mona-editor-image-inserter>
    `,
    imports: [EditorTextAlignmentsComponent, EditorTaskListComponent, EditorImageInserterComponent],
    providers: [
        {
            provide: EditorService,
            useValue: {
                editor: {
                    isActive: () => false,
                    chain: () => ({
                        focus: () => ({
                            setTextAlign: () => ({ run: () => {} }),
                            unsetTextAlign: () => ({ run: () => {} }),
                            toggleTaskList: () => ({ run: () => {} })
                        })
                    })
                },
                state: () => ({})
            }
        }
    ]
})
class EditorTestHostComponent {
    public readonly alignments = viewChild.required(EditorTextAlignmentsComponent);
    public readonly imageInserter = viewChild.required(EditorImageInserterComponent);
    public readonly taskList = viewChild.required(EditorTaskListComponent);
}

const TR_LOCALE: MonaLocale = {
    id: "tr-TR",
    direction: "ltr",
    messages: {
        editor: {
            alignLeft: "Sola hizala",
            alignCenter: "Ortala",
            alignRight: "Sağa hizala",
            justify: "İki yana yasla",
            insertTaskList: "Görev listesi ekle",
            imageUrl: "Görsel URL",
            altText: "Alternatif Metin",
            widthPx: "Genişlik (px)",
            heightPx: "Yükseklik (px)",
            insert: "Ekle",
            cancel: "İptal"
        }
    }
};

describe("Editor Components i18n", () => {
    it("updates toolbar button titles and dialog labels reactively when locale changes", () => {
        const fixture: ComponentFixture<EditorTestHostComponent> = TestBed.createComponent(EditorTestHostComponent);
        const i18nService = TestBed.inject(MonaI18nService);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // Verify default English titles
        const alignLeftBtn = hostEl.querySelector("button[title='Align text left']");
        expect(alignLeftBtn).toBeTruthy();

        const taskListBtn = hostEl.querySelector("button[title='Insert task list']");
        expect(taskListBtn).toBeTruthy();

        // Verify default English image inserter labels
        expect(hostEl.textContent).toContain("Image URL");
        expect(hostEl.textContent).toContain("Alt Text");
        expect(hostEl.textContent).toContain("Width (px)");
        expect(hostEl.textContent).toContain("Height (px)");

        // Switch to Turkish
        i18nService.use(TR_LOCALE);
        fixture.detectChanges();

        // Verify Turkish titles
        const trAlignLeftBtn = hostEl.querySelector("button[title='Sola hizala']");
        expect(trAlignLeftBtn).toBeTruthy();

        const trTaskListBtn = hostEl.querySelector("button[title='Görev listesi ekle']");
        expect(trTaskListBtn).toBeTruthy();

        // Verify Turkish image inserter labels
        expect(hostEl.textContent).toContain("Görsel URL");
        expect(hostEl.textContent).toContain("Alternatif Metin");
        expect(hostEl.textContent).toContain("Genişlik (px)");
        expect(hostEl.textContent).toContain("Yükseklik (px)");
    });
});
