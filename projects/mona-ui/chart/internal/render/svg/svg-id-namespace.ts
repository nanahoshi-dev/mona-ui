let nextInstanceId = 1;

export function resetSvgIdCounterForTesting(): void {
    nextInstanceId = 1;
}

export class SvgIdNamespace {
    public readonly instanceId: number;

    public constructor(instanceId?: number) {
        this.instanceId = instanceId ?? nextInstanceId++;
    }

    public id(suffix: string): string {
        return `mona-chart-svg-${this.instanceId}-${suffix}`;
    }

    public url(suffix: string): string {
        return `url(#${this.id(suffix)})`;
    }
}
