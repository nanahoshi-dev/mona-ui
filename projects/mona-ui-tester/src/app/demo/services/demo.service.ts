import { httpResource } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { ComponentMetadata } from "../models/ComponentMetadata";

@Injectable({
    providedIn: "root"
})
export class DemoService {
    readonly #metadata = httpResource<Record<string, ComponentMetadata>>(() => "assets/component-metadata.json");
    public readonly metadata$ = toObservable(this.#metadata.value);
    public readonly metadata = this.#metadata.value.asReadonly();
}
