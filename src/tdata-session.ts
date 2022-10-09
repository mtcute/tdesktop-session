import { FsAccessInterface } from './fs'
import { buffersEqual, randomBytes } from '@mtcute/core'
import { intToBytesArray, toFilePart } from './util'
import { createAesIgeForMessageOld } from '@mtcute/core/utils/crypto/mtproto'
import {
    readSetting,
    SettingsBlockId,
    SettingsField,
} from './types/settings-blocks'
import { QtReader } from './qt-reader'
import { ITdCryptoProvider, TdCryptoProviderFactory } from './crypto'
import { LocalStorageField, lsBlockReaders } from './types/ls-keys'
import Long from 'long'
import { TdAuthKey, TdKeyData, TdMtpAuthorization } from './types/misc'
import { QtWriter } from './qt-writer'

const TDF_MAGIC = Buffer.from('TDF$')
const TDF_VERSION = 3007006

interface TdSessionParams {
    /**
     * Whether host machine has LE processor (default true, try changing in case of errors)
     */
    le?: boolean

    /**
     * Whether to ignore versions higher than supported.
     * Much higher possibility of errors
     */
    ignoreVersion?: boolean

    /**
     * Override current version.
     * Much higher possibility of errors
     */
    overrideVersion?: number

    /**
     * Value of -key cli parameter.
     * Defaults to `data`
     */
    dataKey?: string
}

export class TdataSession {
    readonly crypto: ITdCryptoProvider

    /**
     * @param fs  FS accessor containing tdata folder
     * @param crypto  Crypto implementation
     * @param passcode  Local passcode (or empty string)
     * @param params
     */
    constructor(
        readonly fs: FsAccessInterface,
        crypto: TdCryptoProviderFactory,
        readonly passcode = '',
        readonly params: TdSessionParams = {}
    ) {
        this.crypto = crypto()
    }

    async readSettingsFile(): Promise<SettingsField[]> {
        const [, data] = await this.readFile('settings')

        let reader = new QtReader(data)
        const salt = reader.qByteArray()
        const settingsEnc = reader.qByteArray()

        const key = await this.createLegacyLocalKey(salt, '')
        const settings = await this.decryptLocal(settingsEnc, key)

        reader = new QtReader(settings)

        const fields: SettingsField[] = []

        while (reader.pos < reader.buffer.length) {
            fields.push(readSetting(reader))
        }

        return fields
    }

    _getDataName(idx: number): string {
        return `${this.params.dataKey ?? 'data'}${
            idx === 0 ? '' : `#${idx + 1}`
        }`
    }

    async _computeDataNameKey(accountIdx: number): Promise<Buffer> {
        const md5 = this.crypto.createMd5()
        await md5.update(Buffer.from(this._getDataName(accountIdx)))
        const r = await md5.digest()
        return r.slice(0, 8)
    }

    async _getDataPath(accountIdx: number): Promise<string> {
        return `${toFilePart(await this._computeDataNameKey(accountIdx))}/`
    }

    async readKeyData(): Promise<TdKeyData> {
        const [, data] = await this.readFile(`key_${this._getDataName(0)}`)
        // salt >> keyEncrypted >> infoEncrypted
        const reader = new QtReader(data)

        const salt = reader.qByteArray()
        const keyEncrypted = reader.qByteArray()
        const infoEncrypted = reader.qByteArray()

        const passcodeKey = await this.createLocalKey(salt)
        const keyInnerData = await this.decryptLocal(keyEncrypted, passcodeKey)
        const infoDecrypted = await this.decryptLocal(
            infoEncrypted,
            keyInnerData
        )
        const info = new QtReader(infoDecrypted)

        const localKey = keyInnerData
        const count = info.int32()
        const order = [...Array(count)].map(() => info.int32())
        const active = info.int32()

        return {
            localKey,
            count,
            order,
            active,
        }
    }

    async writeKeyData(keyData: Omit<TdKeyData, 'localKey'>): Promise<Buffer> {
        const info = new QtWriter()
        info.int32(keyData.count)
        keyData.order.forEach((i) => info.int32(i))
        info.int32(keyData.active)
        const infoDecrypted = info.result()

        const keyInnerData = randomBytes(256)
        const infoEncrypted = await this.encryptLocal(
            infoDecrypted,
            keyInnerData
        )

        const salt = randomBytes(32)
        const passcodeKey = await this.createLocalKey(salt)

        const keyEncrypted = await this.encryptLocal(keyInnerData, passcodeKey)

        const data = new QtWriter()
        data.qByteArray(salt)
        data.qByteArray(keyEncrypted)
        data.qByteArray(infoEncrypted)

        await this.writeFile(`key_${this._getDataName(0)}`, data.result())

        return keyInnerData
    }

    async readMapFile(
        localKey?: Buffer,
        accountIdx = 0
    ): Promise<LocalStorageField[]> {
        const dataPath = await this._getDataPath(accountIdx)
        const [version, data] = await this.readFile(`${dataPath}map`)
        // legacySalt >> legacyKeyEncrypted >> mapEncrypted
        const reader = new QtReader(data)

        const legacySalt = reader.qByteArray()
        const legacyKeyEncrypted = reader.qByteArray()
        const mapEncrypted = reader.qByteArray()

        if (!localKey && legacySalt.length) {
            const legacyPasscodeKey = await this.createLegacyLocalKey(
                legacySalt
            )
            localKey = await this.decryptLocal(
                legacyKeyEncrypted,
                legacyPasscodeKey
            )
        }
        if (!localKey) {
            throw new Error('Local key not provided')
        }

        const mapDecrypted = await this.decryptLocal(mapEncrypted, localKey)
        const map = new QtReader(mapDecrypted)

        const fields: LocalStorageField[] = []

        while (map.pos < map.buffer.length) {
            const type = map.int32()

            const fn = (lsBlockReaders as any)[type]

            if (!fn) {
                throw new Error(
                    `Unknown block ${type} (0x${type.toString(16)})`
                )
            }

            const r = fn(map)
            if (r) {
                fields.push(r)
            }
        }

        return fields
    }

    async writeMapFile(
        fields: LocalStorageField[],
        localKey: Buffer,
        accountIdx = 0
    ): Promise<void> {
        const map = new QtWriter()
        // todo yes im lazy piece of shit

        const mapDecrypted = map.result()
        const mapEncrypted = await this.encryptLocal(mapDecrypted, localKey)

        const writer = new QtWriter()
        writer.qByteArray(Buffer.alloc(0)) // legacySalt
        writer.qByteArray(Buffer.alloc(0)) // legacyKeyEncrypted
        writer.qByteArray(mapEncrypted)

        const dataPath = await this._getDataPath(accountIdx)
        await this.writeFile(`${dataPath}map`, writer.result(), true)
    }

    async readMtpAuthorization(
        localKey: Buffer,
        accountIdx = 0
    ): Promise<TdMtpAuthorization> {
        const [, mtpData] = await this.readEncryptedFile(
            await this._computeDataNameKey(accountIdx),
            localKey
        )

        let reader = new QtReader(mtpData)
        let data
        while (!reader.ended) {
            const s = readSetting(reader)
            if (s._ === 'mtpAuthorization') {
                data = s.value
            }
        }

        if (!data) {
            throw new Error('Did not find mtp auth data')
        }

        reader = new QtReader(data)
        const legacyUserId = reader.int32()
        const legacyMainDcId = reader.int32()

        let userId, mainDcId
        if (legacyMainDcId === -1 && legacyMainDcId === -1) {
            userId = reader.uint64()
            mainDcId = reader.int32()
        } else {
            userId = Long.fromInt(legacyUserId)
            mainDcId = legacyMainDcId
        }

        function readKeys(target: TdAuthKey[]) {
            const count = reader.uint32()

            for (let i = 0; i < count; i++) {
                const dcId = reader.int32()
                const key = reader.raw(256)
                target.push({ dcId, key })
            }
        }

        const authKeys: TdAuthKey[] = []
        const authKeysToDestroy: TdAuthKey[] = []

        readKeys(authKeys)
        readKeys(authKeysToDestroy)

        return {
            userId,
            mainDcId,
            authKeys,
            authKeysToDestroy,
        }
    }

    async writeMtpAuthorization(
        mtp: TdMtpAuthorization,
        localKey: Buffer,
        accountIdx = 0
    ): Promise<void> {
        const writer = new QtWriter()

        // legacy user id & dc id
        writer.int32(-1)
        writer.int32(-1)
        writer.int64(mtp.userId)
        writer.int32(mtp.mainDcId)

        function writeKeys(keys: TdAuthKey[]) {
            writer.int32(keys.length)
            keys.forEach((k) => {
                writer.int32(k.dcId)
                writer.raw(k.key)
            })
        }

        writeKeys(mtp.authKeys)
        writeKeys(mtp.authKeysToDestroy)

        const mtpDataWriter = new QtWriter()
        mtpDataWriter.int32(SettingsBlockId.dbiMtpAuthorization)
        mtpDataWriter.qByteArray(writer.result())

        await this.writeEncryptedFile(
            await this._computeDataNameKey(accountIdx),
            localKey,
            mtpDataWriter.result()
        )
    }

    async readFile(filename: string): Promise<[number, Buffer]> {
        const order: string[] = []

        const modern = `${filename}s`
        if (await this.fs.stat(modern)) {
            order.push(modern)
        } else {
            const try0 = `${filename}0`
            const try1 = `${filename}1`

            const try0s = await this.fs.stat(try0)
            const try1s = await this.fs.stat(try1)

            if (try0s) {
                order.push(try0)

                if (try1s) {
                    order.push(try1)
                    if (try0s.lastModified < try1s.lastModified) {
                        order.reverse()
                    }
                }
            } else if (try1s) {
                order.push(try1)
            }
        }

        let lastError = 'file not found'

        for (const file of order) {
            const data = await this.fs.readFile(file)
            const magic = data.slice(0, 4)

            if (!buffersEqual(magic, TDF_MAGIC)) {
                lastError = 'Invalid magic'
                continue
            }

            const version = this.readInt32(data, 4)
            if (version > TDF_VERSION && !this.params.ignoreVersion) {
                lastError = `Unsupported version: ${version}`
                continue
            }

            const dataSize = data.length - 24
            const bytes = data.slice(8, dataSize + 8)

            const md5 = this.crypto.createMd5()
            await md5.update(bytes)
            await md5.update(intToBytesArray(dataSize, this.params.le ?? true))
            await md5.update(intToBytesArray(version, this.params.le ?? true))
            await md5.update(magic)

            if (!buffersEqual(await md5.digest(), data.slice(dataSize + 8))) {
                lastError = 'md5 mismatch'
                continue
            }

            return [version, bytes]
        }

        throw new Error(`failed to read ${filename}, last error: ${lastError}`)
    }

    async writeFile(
        filename: string,
        data: Buffer,
        mkdir = false
    ): Promise<void> {
        filename += 's'

        const version = intToBytesArray(
            this.params.overrideVersion ?? TDF_VERSION,
            this.params.le ?? true
        )
        const dataSize = intToBytesArray(data.length, this.params.le ?? true)
        const md5 = this.crypto.createMd5()
        await md5.update(data)
        await md5.update(dataSize)
        await md5.update(version)
        await md5.update(TDF_MAGIC)

        await this.fs.writeFile(
            filename,
            Buffer.concat([TDF_MAGIC, version, data, await md5.digest()]),
            mkdir
        )
    }

    async readEncryptedFile(
        filename: string | Long | Buffer,
        key: Buffer,
        base: string | number = ''
    ): Promise<[number, Buffer]> {
        if (typeof filename !== 'string') {
            filename = toFilePart(filename)
        }

        if (typeof base === 'number') {
            base = await this._getDataPath(base)
        }

        if (base) {
            filename = base + filename
        }

        const [version, data] = await this.readFile(filename)

        const encrypted = new QtReader(data).qByteArray()
        const decrypted = await this.decryptLocal(encrypted, key)
        return [version, decrypted]
    }

    async writeEncryptedFile(
        filename: string | Long | Buffer,
        key: Buffer,
        data: Buffer,
        base: string | number = '',
        mkdir = false
    ): Promise<void> {
        if (typeof filename !== 'string') {
            filename = toFilePart(filename)
        }

        if (typeof base === 'number') {
            base = await this._getDataPath(base)
        }

        if (base) {
            filename = base + filename
        }

        const encryptedInner = await this.encryptLocal(data, key)

        const writer = new QtWriter()
        writer.qByteArray(encryptedInner)

        await this.writeFile(filename, writer.result(), mkdir)
    }

    async createLegacyLocalKey(
        salt: Buffer,
        passcode = this.passcode
    ): Promise<Buffer> {
        return this.crypto.pbkdf2(
            Buffer.from(passcode),
            salt,
            passcode === '' ? 4 : 4000,
            256,
            'sha1'
        )
    }

    async createLocalKey(
        salt: Buffer,
        passcode = this.passcode
    ): Promise<Buffer> {
        const hash = await this.crypto.sha512(
            Buffer.concat([salt, Buffer.from(passcode), salt])
        )

        return this.crypto.pbkdf2(
            hash,
            salt,
            passcode === '' ? 1 : 100000,
            256,
            'sha512'
        )
    }

    async decryptLocal(encrypted: Buffer, key: Buffer): Promise<Buffer> {
        const encryptedKey = encrypted.slice(0, 16)
        const encryptedData = encrypted.slice(16)

        const ige = await createAesIgeForMessageOld(
            this.crypto,
            key,
            encryptedKey,
            false
        )
        const decrypted = await ige.decrypt(encryptedData)

        if (
            !buffersEqual(
                (await this.crypto.sha1(decrypted)).slice(0, 16),
                encryptedKey
            )
        ) {
            throw new Error('Failed to decrypt, invalid password?')
        }

        const fullLen = encryptedData.length
        const dataLen = this.readInt32(decrypted, 0)

        if (
            dataLen > decrypted.length ||
            dataLen <= fullLen - 16 ||
            dataLen < 4
        ) {
            throw new Error('Failed to decrypt, invalid data length')
        }

        return decrypted.slice(4, dataLen)
    }

    async encryptLocal(data: Buffer, key: Buffer): Promise<Buffer> {
        const dataSize = data.length + 4
        const padding: Buffer =
            dataSize & 0x0f
                ? randomBytes(0x10 - (dataSize & 0x0f))
                : Buffer.alloc(0)

        const toEncrypt = Buffer.alloc(dataSize + padding.length)
        this.writeInt32(toEncrypt, 0, dataSize)
        data.copy(toEncrypt, 4)
        padding.copy(toEncrypt, 4 + data.length)

        const encryptedKey = (await this.crypto.sha1(toEncrypt)).slice(0, 16)

        const ige = await createAesIgeForMessageOld(
            this.crypto,
            key,
            encryptedKey,
            false
        )
        const encryptedData = await ige.encrypt(toEncrypt)

        return Buffer.concat([encryptedKey, encryptedData])
    }

    readInt32(buf: Buffer, offset: number): number {
        return buf[this.params.le ? 'readInt32BE' : 'readInt32LE'](offset)
    }

    writeInt32(buf: Buffer, offset: number, value: number): void {
        buf[this.params.le ? 'writeInt32BE' : 'writeInt32LE'](value, offset)
    }
}
