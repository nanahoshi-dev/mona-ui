import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ListItem } from "../../models/ListItem";
import { ListService } from "../../services/list.service";

import { ListItemComponent } from "./list-item.component";

describe("ListItemComponent", () => {
    let component: ListItemComponent<string>;
    let fixture: ComponentFixture<ListItemComponent<string>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ListItemComponent],
            providers: [ListService]
        }).compileComponents();

        fixture = TestBed.createComponent(ListItemComponent<string>);
        component = fixture.componentInstance;
        fixture.componentRef.setInput(
            "item",
            new ListItem<string>({
                data: "test",
                header: "test"
            })
        );
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
