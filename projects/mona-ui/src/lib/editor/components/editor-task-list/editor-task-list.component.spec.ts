import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorTaskListComponent } from "./editor-task-list.component";

describe("EditorTaskListComponent", () => {
    let component: EditorTaskListComponent;
    let fixture: ComponentFixture<EditorTaskListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorTaskListComponent],
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

        fixture = TestBed.createComponent(EditorTaskListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
