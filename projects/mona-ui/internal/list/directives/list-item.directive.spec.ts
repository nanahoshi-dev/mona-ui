import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ListItem } from "../models/ListItem";
import { ListService } from "../services/list.service";
import { listItemContentThemeVariants } from "../styles/list.styles";
import { ListItemDirective } from "./list-item.directive";

@Component({
    imports: [ListItemDirective],
    template: `
        <ul>
            <li monaListItem [item]="listItem"></li>
        </ul>
    `,
    providers: [ListService]
})
class TestComponent {
    public listItem: ListItem<any> = new ListItem<any>({
        header: "header",
        data: {
            id: 1,
            name: "name"
        }
    });
}

describe("ListItemDirective", () => {
    let fixture: ComponentFixture<TestComponent>;
    let component: TestComponent;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestComponent],
            providers: [ListService]
        }).compileComponents();
        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it("should create an instance", () => {
        expect(component).toBeTruthy();
    });

    it("uses neutral persistent and highlighted states", () => {
        const classes = listItemContentThemeVariants({
            checkboxes: false,
            disabled: false,
            highlighted: true,
            selected: true
        });

        expect(classes).toContain("bg-(--color-selected)");
        expect(classes).toContain("text-(--color-selected-foreground)");
        expect(classes).toContain("inset-ring-focus-indicator/35");
        expect(classes).not.toContain("bg-primary");
        expect(classes).not.toContain("bg-accent-hover");
    });
});
