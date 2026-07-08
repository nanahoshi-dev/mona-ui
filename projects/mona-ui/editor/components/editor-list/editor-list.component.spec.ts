import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorListComponent } from "./editor-list.component";

describe("EditorListComponent", () => {
    let component: EditorListComponent;
    let fixture: ComponentFixture<EditorListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorListComponent],
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

        fixture = TestBed.createComponent(EditorListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
