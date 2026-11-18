/** A file to put in a zip archive. */
export interface ZipEntry {
    readonly data: Uint8Array;
    /** The path in the archive, with `/` between folders. */
    readonly name: string;
}

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
/** Version 2.0: deflate, folders. */
const ZIP_VERSION = 20;
/** General purpose flag bit 11: names are UTF-8. */
const UTF8_FLAG = 0x0800;
const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;

let crcTable: Uint32Array | null = null;

/**
 * Builds a zip archive. Each file is compressed with the browser's `CompressionStream` where it supports raw deflate
 * and that makes the file smaller; otherwise it's stored as it is, which every zip reader opens too.
 */
export async function createZip(entries: readonly ZipEntry[], modified: Date = new Date()): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const { date, time } = toDosDateTime(modified);
    const parts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;
    for (const entry of entries) {
        const name = encoder.encode(entry.name);
        const crc = crc32(entry.data);
        const deflated = await deflateRaw(entry.data);
        const compressed = deflated != null && deflated.length < entry.data.length;
        const content = compressed ? deflated : entry.data;
        const method = compressed ? METHOD_DEFLATE : METHOD_STORE;

        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, LOCAL_HEADER_SIGNATURE, true);
        local.setUint16(4, ZIP_VERSION, true);
        local.setUint16(6, UTF8_FLAG, true);
        local.setUint16(8, method, true);
        local.setUint16(10, time, true);
        local.setUint16(12, date, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, content.length, true);
        local.setUint32(22, entry.data.length, true);
        local.setUint16(26, name.length, true);
        local.setUint16(28, 0, true);
        parts.push(new Uint8Array(local.buffer), name, content);

        const central = new DataView(new ArrayBuffer(46));
        central.setUint32(0, CENTRAL_HEADER_SIGNATURE, true);
        central.setUint16(4, ZIP_VERSION, true);
        central.setUint16(6, ZIP_VERSION, true);
        central.setUint16(8, UTF8_FLAG, true);
        central.setUint16(10, method, true);
        central.setUint16(12, time, true);
        central.setUint16(14, date, true);
        central.setUint32(16, crc, true);
        central.setUint32(20, content.length, true);
        central.setUint32(24, entry.data.length, true);
        central.setUint16(28, name.length, true);
        // Extra field, comment, disk and attributes stay 0.
        central.setUint32(42, offset, true);
        centralParts.push(new Uint8Array(central.buffer), name);

        offset += 30 + name.length + content.length;
    }
    const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
    end.setUint16(8, entries.length, true);
    end.setUint16(10, entries.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    return concat([...parts, ...centralParts, new Uint8Array(end.buffer)]);
}

/** The CRC-32 a zip archive stores for each file (the IEEE polynomial). */
export function crc32(data: Uint8Array): number {
    const table = (crcTable ??= createCrcTable());
    let crc = 0xffffffff;
    for (const byte of data) {
        crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
    const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
    let offset = 0;
    for (const part of parts) {
        result.set(part, offset);
        offset += part.length;
    }
    return result;
}

function createCrcTable(): Uint32Array {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index++) {
        let value = index;
        for (let bit = 0; bit < 8; bit++) {
            value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
        }
        table[index] = value >>> 0;
    }
    return table;
}

/** Raw deflate (RFC 1951), as zip stores it, or `null` where the browser can't compress. */
async function deflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
    if (typeof CompressionStream === "undefined") {
        return null;
    }
    let stream: CompressionStream;
    try {
        stream = new CompressionStream("deflate-raw");
    } catch {
        return null;
    }
    const writer = stream.writable.getWriter();
    void writer.write(data as Uint8Array<ArrayBuffer>);
    void writer.close();
    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    for (let result = await reader.read(); !result.done; result = await reader.read()) {
        chunks.push(result.value);
    }
    return concat(chunks);
}

/** The local date and time in the MS-DOS format zip headers use, from 1980 on. */
function toDosDateTime(value: Date): { readonly date: number; readonly time: number } {
    const year = Math.min(Math.max(value.getFullYear(), 1980), 2107);
    return {
        date: ((year - 1980) << 9) | ((value.getMonth() + 1) << 5) | value.getDate(),
        time: (value.getHours() << 11) | (value.getMinutes() << 5) | Math.floor(value.getSeconds() / 2)
    };
}
