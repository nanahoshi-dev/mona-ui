import { Injectable, signal, TemplateRef } from "@angular/core";

@Injectable()
export class MultiSelectService {
    public readonly summaryTagTemplate = signal<TemplateRef<unknown> | null>(null);
    public readonly tagCount = signal(-1);
}
