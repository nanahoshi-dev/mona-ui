import { Injectable, signal, type TemplateRef } from "@angular/core";

@Injectable()
export class MultiSelectService {
    public readonly summaryTagTemplate = signal<TemplateRef<unknown> | null>(null);
    public readonly tagCount = signal(-1);
}
