import { Injectable, signal } from "@angular/core";

@Injectable()
export class FormFieldValidationService {
    public readonly invalid = signal(false);
}
