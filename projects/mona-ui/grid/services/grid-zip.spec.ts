import { crc32, createZip } from "./grid-zip";
import { readZip } from "./testing/read-zip";

const encoder = new TextEncoder();

describe("createZip", () => {
    it("computes the zip CRC-32", () => {
        expect(crc32(encoder.encode("123456789"))).toBe(0xcbf43926);
        expect(crc32(new Uint8Array())).toBe(0);
    });

    it("writes files a zip reader reads back, compressing the ones that shrink", async () => {
        const text = "<row>".repeat(500);
        const zip = await createZip(
            [
                { data: encoder.encode(text), name: "xl/worksheets/sheet1.xml" },
                { data: encoder.encode("ä"), name: "names/ünïcode.txt" }
            ],
            new Date(2024, 4, 6, 13, 45, 30)
        );

        const files = await readZip(zip);
        expect([...files.keys()]).toEqual(["xl/worksheets/sheet1.xml", "names/ünïcode.txt"]);
        expect(files.get("xl/worksheets/sheet1.xml")).toBe(text);
        expect(files.get("names/ünïcode.txt")).toBe("ä");

        const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
        expect(view.getUint32(0, true)).toBe(0x04034b50);
        // The repeated text deflates; the 2-byte file is stored as it is.
        expect(view.getUint16(8, true)).toBe(8);
        expect(view.getUint32(18, true)).toBeLessThan(text.length);
        // The UTF-8 flag, and the local date and time in MS-DOS form.
        expect(view.getUint16(6, true)).toBe(0x0800);
        expect(view.getUint16(12, true)).toBe(((2024 - 1980) << 9) | (5 << 5) | 6);
        expect(view.getUint16(10, true)).toBe((13 << 11) | (45 << 5) | 15);
    });

    it("stores every file where the browser has no CompressionStream", async () => {
        vi.stubGlobal("CompressionStream", undefined);
        try {
            const text = "aaaa".repeat(100);
            const zip = await createZip([{ data: encoder.encode(text), name: "a.txt" }]);

            const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
            expect(view.getUint16(8, true)).toBe(0);
            expect((await readZip(zip)).get("a.txt")).toBe(text);
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
