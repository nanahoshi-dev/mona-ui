/**
 * Reads the files of a zip archive as text, for specs. Handles the stored and deflated files `createZip` writes.
 */
export async function readZip(bytes: Uint8Array): Promise<Map<string, string>> {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let end = bytes.length - 22;
    while (end > 0 && view.getUint32(end, true) !== 0x06054b50) {
        end--;
    }
    const count = view.getUint16(end + 10, true);
    let offset = view.getUint32(end + 16, true);
    const decoder = new TextDecoder();
    const files = new Map<string, string>();
    for (let index = 0; index < count; index++) {
        if (view.getUint32(offset, true) !== 0x02014b50) {
            throw new Error(`No central directory header at ${offset}`);
        }
        const method = view.getUint16(offset + 10, true);
        const size = view.getUint32(offset + 20, true);
        const nameLength = view.getUint16(offset + 28, true);
        const extraLength = view.getUint16(offset + 30, true);
        const commentLength = view.getUint16(offset + 32, true);
        const localOffset = view.getUint32(offset + 42, true);
        const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
        const start =
            localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
        const data = bytes.subarray(start, start + size);
        files.set(name, decoder.decode(method === 8 ? await inflateRaw(data) : data));
        offset += 46 + nameLength + extraLength + commentLength;
    }
    return files;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
    const stream = new DecompressionStream("deflate-raw");
    const writer = stream.writable.getWriter();
    void writer.write(data as Uint8Array<ArrayBuffer>);
    void writer.close();
    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    for (let result = await reader.read(); !result.done; result = await reader.read()) {
        chunks.push(result.value);
    }
    const inflated = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
    let position = 0;
    for (const chunk of chunks) {
        inflated.set(chunk, position);
        position += chunk.length;
    }
    return inflated;
}
