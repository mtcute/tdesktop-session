import Long from "long";

export function intToBytesArray(int: number, le: boolean): Buffer {
    const buf = Buffer.alloc(4)
    buf[le ? 'writeInt32LE' : 'writeInt32BE'](int)
    return buf
}

const ALPHABET = '0123456789ABCDEF'
export function toFilePart(key: Buffer | Long): string {
    // we need to swap lo/hi of each byte before converting to hex
    // idk why tdesktop does that but whatever
    if (Long.isLong(key)) {
        key = Buffer.from(key.toBytes(true))
    }

    let str = ''
    for (let i = 0; i < 8; i++) {
        const b = key[i]
        const low = b & 0x0f
        const high = b >> 4
        str += ALPHABET[low] + ALPHABET[high]
    }
    return str
}