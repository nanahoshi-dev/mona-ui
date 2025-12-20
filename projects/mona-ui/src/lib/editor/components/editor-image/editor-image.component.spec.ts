import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorImageComponent } from "./editor-image.component";

describe("EditorImageComponent", () => {
    let component: EditorImageComponent;
    let fixture: ComponentFixture<EditorImageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorImageComponent],
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

        fixture = TestBed.createComponent(EditorImageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
