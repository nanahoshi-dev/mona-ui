import { Component } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { Enumerable } from "@mirei/ts-collections";
import { DateTime } from "luxon";
import { CalendarComponent } from "./calendar.component";

@Component({
    template: ` <mona-calendar
        [disabled]="disabled"
        [ngModel]="date"
        [min]="min"
        [max]="max"
        [disabledDates]="disabledDates"
        (ngModelChange)="onDateChange($event)"></mona-calendar>`,
    imports: [CalendarComponent, FormsModule]
})
class CalendarComponentTestComponent {
    public date: Date | null = new Date();
    public disabled: boolean = false;
    public disabledDates: Date[] = [];
    public max: Date | null = null;
    public min: Date | null = null;

    public onDateChange(date: Date): void {
        this.date = date;
    }
}

describe("CalendarComponent", () => {
    let component: CalendarComponent;
    let fixture: ComponentFixture<CalendarComponent>;
    let hostComponent: CalendarComponentTestComponent;
    let hostFixture: ComponentFixture<CalendarComponentTestComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [CalendarComponent, CalendarComponentTestComponent, FormsModule]
        });
        fixture = TestBed.createComponent(CalendarComponent);
        component = fixture.componentInstance;

        hostFixture = TestBed.createComponent(CalendarComponentTestComponent);
        hostComponent = hostFixture.componentInstance;

        fixture.detectChanges();
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });






















});

function switchToYearView(fixture: ComponentFixture<CalendarComponentTestComponent>): void {
    const header = fixture.debugElement.query(By.css(".mona-calendar-header"));
    const monthButton = header.query(By.css("div:nth-child(2) button"));
    monthButton.nativeElement.click();

    tick();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
}

function switchToDecadeView(fixture: ComponentFixture<CalendarComponentTestComponent>): void {
    switchToYearView(fixture);

    const yearHeader = fixture.debugElement.query(By.css(".mona-calendar-header"));
    const yearButton = yearHeader.query(By.css("div:nth-child(2) button"));
    yearButton.nativeElement.click();

    tick();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
}

function navigateCalendar(fixture: ComponentFixture<CalendarComponentTestComponent>, direction: "prev" | "next"): void {
    const header = fixture.debugElement.query(By.css(".mona-calendar-header"));
    const child = direction === "prev" ? 1 : 3;
    const monthButton = header.query(By.css(`div:nth-child(${child}) button`));
    monthButton.nativeElement.click();

    tick();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
}

function setCalendarDateOfHost(fixture: ComponentFixture<CalendarComponentTestComponent>, date: Date | null = DateTime.fromISO("2023-09-16").toJSDate()): Date | null {
    fixture.componentInstance.date = date;
    fixture.detectChanges();

    return date;
}
