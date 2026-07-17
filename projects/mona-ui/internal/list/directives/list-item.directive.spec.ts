import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ListItem } from "../models/ListItem";
import { ListService } from "../services/list.service";
import { listItemContentVariants } from "../styles/list.styles";
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

    it("uses neutral accent states for selected items", () => {
        const classes = listItemContentVariants({
            checkboxes: false,
            disabled: false,
            highlighted: false,
            selected: true
        });

        expect(classes).toContain("bg-accent-hover");
        expect(classes).toContain("text-accent-foreground");
        expect(classes).not.toContain("bg-primary");
    });
});
