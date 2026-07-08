import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorImageInserterComponent } from "./editor-image-inserter.component";

describe("EditorImageInserterComponent", () => {
    let component: EditorImageInserterComponent;
    let fixture: ComponentFixture<EditorImageInserterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorImageInserterComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive")
                        },
                        state: vi.fn()
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorImageInserterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
