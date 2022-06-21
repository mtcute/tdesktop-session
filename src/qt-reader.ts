import Long from 'long'

export class QtReader {
    pos: number

    constructor(readonly buffer: Buffer, offset = 0) {
        this.pos = offset
    }

    get ended(): boolean {
        return this.pos === this.buffer.length
    }

    int32(): number {
        const val = this.buffer.readInt32BE(this.pos)
        this.pos += 4
        return val
    }

    uint32(): number {
        const val = this.buffer.readUint32BE(this.pos)
        this.pos += 4
        return val
    }
    
    int64(): Long {
        const high = this.buffer.readInt32BE(this.pos)
        const low = this.buffer.readInt32BE(this.pos + 4)
        this.pos += 8
        return new Long(low, high)
    }

    uint64(): Long {
        return this.int64().toUnsigned()
    }

    raw(length: number): Buffer {
        return this.buffer.slice(this.pos, this.pos += length)
    }

    qByteArray(): Buffer {
        const length = this.uint32()
        if (length === 0 || length === 0xffffffff) {
            return Buffer.alloc(0)
        }

        return this.raw(length)
    }

    charArray(): Buffer {
        const buf = this.qByteArray()
        if (buf.length) return buf.slice(0, -1)
        return buf
    }

    qString(): string {
        return this.qByteArray().swap16().toString('utf16le')
    }
}