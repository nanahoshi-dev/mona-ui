/** A PDF's objects as text, with their streams inflated, for tests to look into. */
export interface ReadPdf {
    /** Each object's dictionary text, by object number. */
    readonly objects: ReadonlyMap<number, string>;
    /** Each object's stream as text, by object number, inflated when it was compressed. */
    readonly streams: ReadonlyMap<number, string>;
    /** The file as Latin-1 text. */
    readonly text: string;
}

/** Reads a PDF the export wrote, checking that its cross-reference table points at every object. */
export async function readPdf(data: Uint8Array): Promise<ReadPdf> {
    const text = Array.from(data, byte => String.fromCharCode(byte)).join("");
    const startXref = Number(/startxref\n(\d+)\n%%EOF\n$/.exec(text)?.[1]);
    if (!Number.isFinite(startXref) || !text.startsWith("xref\n", startXref)) {
        throw new Error("startxref doesn't point at the cross-reference table.");
    }
    const [, firstLine] = /^xref\n0 (\d+)\n/.exec(text.slice(startXref)) ?? [];
    const count = Number(firstLine);
    const entries = text
        .slice(startXref)
        .split("\n")
        .slice(2, 2 + count);
    const objects = new Map<number, string>();
    const streams = new Map<number, string>();
    for (let id = 1; id < count; id++) {
        const offset = Number(entries[id].slice(0, 10));
        if (!text.startsWith(`${id} 0 obj\n`, offset)) {
            throw new Error(`The cross-reference entry of object ${id} doesn't point at it.`);
        }
        const end = text.indexOf("\nendobj\n", offset);
        const body = text.slice(offset + `${id} 0 obj\n`.length, end);
        const streamStart = body.indexOf(">>\nstream\n");
        if (streamStart < 0) {
            objects.set(id, body);
            continue;
        }
        const dictionary = body.slice(0, streamStart + 2);
        objects.set(id, dictionary);
        const length = Number(/\/Length (\d+)/.exec(dictionary)?.[1]);
        const bytes = Uint8Array.from(
            body.slice(streamStart + ">>\nstream\n".length, streamStart + ">>\nstream\n".length + length),
            char => char.charCodeAt(0)
        );
        const content = dictionary.includes("/FlateDecode") ? await inflate(bytes) : bytes;
        streams.set(id, Array.from(content, byte => String.fromCharCode(byte)).join(""));
    }
    return { objects, streams, text };
}

/** The text shown with Tj in a content stream, decoded from WinAnsi hex strings. */
export function shownText(stream: string): string[] {
    const decoder = new TextDecoder("windows-1252");
    return Array.from(stream.matchAll(/\/F[12] [\d.]+ Tf .*?<([0-9A-F]*)> Tj/g), match =>
        decoder.decode(Uint8Array.from(match[1].match(/../g) ?? [], hex => parseInt(hex, 16)))
    );
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
    const stream = new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}
