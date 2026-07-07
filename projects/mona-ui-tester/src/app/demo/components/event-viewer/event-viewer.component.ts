import { afterNextRender, ChangeDetectionStrategy, Component, input, OutputEmitterRef, signal } from "@angular/core";
import { ImmutableList } from "@mirei/ts-collections";
import { PreventableEvent } from "mona-ui/utils";
import { ButtonDirective } from "mona-ui/button";

interface OutputEventItem {
    readonly name: string;
    readonly emitter: OutputEmitterRef<any>;
    readonly source: string;
}

interface EventLogItem {
    readonly name: string;
    readonly prevented: boolean;
    readonly value: string;
}

@Component({
    selector: "app-event-viewer",
    templateUrl: "./event-viewer.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonDirective],
    host: {
        class: "w-full overflow-hidden h-80 border border-border flex flex-col"
    }
})
export class EventViewerComponent<T> {
    protected readonly eventLog = signal(ImmutableList.create<EventLogItem>());
    public readonly instances = input.required<T[]>();

    public constructor() {
        afterNextRender({
            read: () => this.#listenOutputs()
        });
    }

    protected clearEventLog(): void {
        this.eventLog.update(list => list.clear());
    }

    #acquireOutputs(): OutputEventItem[] {
        const allOutputs: OutputEventItem[] = [];
        for (const instance of this.instances()) {
            if (!instance) {
                continue;
            }

            let currentObj = instance;
            while (currentObj && currentObj !== Object.prototype) {
                const keys = Object.getOwnPropertyNames(currentObj);
                for (const key of keys) {
                    const value = (instance as any)[key];
                    if (value instanceof OutputEmitterRef) {
                        allOutputs.push({
                            name: key,
                            emitter: value,
                            source: instance.constructor.name
                        });
                    }
                }
                currentObj = Object.getPrototypeOf(currentObj);
            }
        }
        return allOutputs;
    }

    #listenOutputs(): void {
        const outputs = this.#acquireOutputs();
        outputs.forEach(output =>
            output.emitter.subscribe((event: unknown) => {
                const name = output.name;
                const prevented = event instanceof PreventableEvent && event.isDefaultPrevented();
                const value = JSON.stringify(event, getSafeReplacer(), 2);
                this.eventLog.update(log => log.addAt({ name, value, prevented }, 0));
            })
        );
    }
}

function getSafeReplacer() {
    const seen = new WeakSet();

    return function (this: any, key: string, value: any) {
        // 1. Pass through primitives
        if (value === null || typeof value !== "object") {
            return value;
        }

        // 2. Halt on Circular References (kept as a safety net for plain objects/arrays)
        if (seen.has(value)) {
            return "[Circular Reference]";
        }
        seen.add(value);

        // 3. Halt on massive DOM/BOM objects
        if (value instanceof Window) {
            return "[Window]";
        }
        if (value instanceof Node) {
            return `[DOM Node: ${value.nodeName}]`;
        }

        // Determine the specific type of object
        const proto = Object.getPrototypeOf(value);
        // Plain objects have Object.prototype or null as their prototype
        const isPlainObject = !proto || proto === Object.prototype;
        const isArray = Array.isArray(value);

        // 4. If it's a nested property AND a class instance, just return the name
        // (key === "" means this is the very first root object being stringified)
        if (key !== "" && !isPlainObject && !isArray) {
            const className = value.constructor?.name || "UnknownClass";
            return `[Class: ${className}]`;
        }

        // 5. If it is a plain object or array, pass it through normally
        if (isPlainObject || isArray) {
            return value;
        }

        // 6. Handle the ROOT Class: Extract own properties + getters safely
        const serialized: Record<string, any> = {};

        for (const k of Object.keys(value)) {
            serialized[k] = value[k];
        }

        let currentProto = proto;
        while (currentProto && currentProto !== Object.prototype) {
            const descriptors = Object.getOwnPropertyDescriptors(currentProto);

            for (const propName of Object.keys(descriptors)) {
                if (descriptors[propName].get) {
                    try {
                        serialized[propName] = value[propName];
                    } catch (e) {
                        serialized[propName] = "[Error reading getter]";
                    }
                }
            }
            currentProto = Object.getPrototypeOf(currentProto);
        }

        return serialized;
    };
}
