import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { EditorService } from "../../services/editor.service";

import { EditorHeadingsComponent } from "./editor-headings.component";

describe("EditorHeadingsComponent", () => {
    let component: EditorHeadingsComponent;
    let fixture: ComponentFixture<EditorHeadingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorHeadingsComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive").mockReturnValue(vi.fn()),
                            chain: vi.fn().mockName("Editor.chain").mockReturnValue(vi.fn().mockReturnValue({
                                focus: vi.fn().mockReturnValue({})
                            }))
                        },
                        state: signal({
                            selection: {
                                $from: {
                                    node: vi.fn().mockName("ResolvedPos.node").mockReturnValue({
                                        type: vi.fn().mockName("Node.type").mockReturnValue({
                                            name: vi.fn().mockName("NodeType.name").mockReturnValue("heading")
                                        })
                                    })
                                }
                            }
                        })
                    }
                },
                provideAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorHeadingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
