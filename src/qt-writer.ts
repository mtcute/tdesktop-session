import Long from "long";

export class QtWriter {
    buffer = Buffer.allocUnsafe(32)
    pos = 0

    private _alloc(size: number) {
        while (this.pos + size > this.buffer.length) {
            const newBuf = Buffer.allocUnsafe(this.buffer.length << 1)
            this.buffer.copy(newBuf)
            this.buffer = newBuf
        }
    }

    int32(value: number): void {
        this._alloc(4)

        this.buffer.writeInt32BE(value, this.pos)
        this.pos += 4
    }

    uint32(value: number): void {
        this._alloc(4)

        this.buffer.writeUint32BE(value, this.pos)
        this.pos += 4
    }

    int64(value: Long): void {
        this._alloc(8)

        this.buffer.writeUint32BE(value.high, this.pos)
        this.buffer.writeUint32BE(value.low, this.pos + 4)
        this.pos += 8
    }

    raw(value: Buffer): void {
        this._alloc(value.length)

        if (value.length) {
            value.copy(this.buffer, this.pos)
        }

        this.pos += value.length
    }

    qByteArray(value: Buffer): void {
        this.uint32(value.length)
        this.raw(value)
    }

    charArray(value: Buffer): void {
        return this.qByteArray(Buffer.concat([value, Buffer.from([0])]))
    }

    qString(value: string): void {
        const utf16 = Buffer.from(value, 'utf16le').swap16()
        this.qByteArray(utf16)
    }

    result(): Buffer {
        return this.buffer.slice(0, this.pos)
    }
}
