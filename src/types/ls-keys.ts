// from https://github.com/telegramdesktop/tdesktop/blob/dev/Telegram/SourceFiles/storage/storage_account.cpp
import { QtReader } from '../qt-reader'
import { tl } from '@mtcute/core'
import { SettingsBlockId } from './settings-blocks'
import Long from 'long'
import { bytesField, uint64Field } from './utils'

enum LocalStorageKeys {
    lskUserMap = 0x00,
    lskDraft = 0x01, // data: PeerId peer
    lskDraftPosition = 0x02, // data: PeerId peer
    lskLegacyImages = 0x03, // legacy
    lskLocations = 0x04, // no data
    lskLegacyStickerImages = 0x05, // legacy
    lskLegacyAudios = 0x06, // legacy
    lskRecentStickersOld = 0x07, // no data
    lskBackgroundOldOld = 0x08, // no data
    lskUserSettings = 0x09, // no data
    lskRecentHashtagsAndBots = 0x0a, // no data
    lskStickersOld = 0x0b, // no data
    lskSavedPeersOld = 0x0c, // no data
    lskReportSpamStatusesOld = 0x0d, // no data
    lskSavedGifsOld = 0x0e, // no data
    lskSavedGifs = 0x0f, // no data
    lskStickersKeys = 0x10, // no data
    lskTrustedBots = 0x11, // no data
    lskFavedStickers = 0x12, // no data
    lskExportSettings = 0x13, // no data
    lskBackgroundOld = 0x14, // no data
    lskSelfSerialized = 0x15, // serialized self
    lskMasksKeys = 0x16, // no data
}

const legacySkip = (reader: QtReader) => {
    const count = reader.int32()
    // FileKey key; quint64 first, second; qint32 size;
    reader.pos += 28 * count
}

export const lsBlockReaders = {
    [LocalStorageKeys.lskDraft](reader: QtReader) {
        const count = reader.int32()
        const drafts: {
            fileKey: Long
            peerId: Long
        }[] = []

        for (let i = 0; i < count; i++) {
            const fileKey = reader.uint64()
            const peerId = reader.uint64()
            drafts.push({
                fileKey,
                peerId,
            })
        }

        return {
            _: 'draft' as const,
            drafts,
        }
    },
    [LocalStorageKeys.lskSelfSerialized]: bytesField('selfSerialized'),
    [LocalStorageKeys.lskDraftPosition](reader: QtReader) {
        const count = reader.int32()
        const drafts: {
            fileKey: Long
            peerId: Long
        }[] = []

        for (let i = 0; i < count; i++) {
            const fileKey = reader.uint64()
            const peerId = reader.uint64()
            drafts.push({
                fileKey,
                peerId,
            })
        }

        return {
            _: 'draftPosition' as const,
            draftCursors: drafts,
        }
    },
    [LocalStorageKeys.lskLegacyImages]: legacySkip,
    [LocalStorageKeys.lskLegacyStickerImages]: legacySkip,
    [LocalStorageKeys.lskLegacyAudios]: legacySkip,
    [LocalStorageKeys.lskLocations]: uint64Field('locations'),
    [LocalStorageKeys.lskReportSpamStatusesOld]: uint64Field(
        'reportSpamStatusesOld'
    ),
    [LocalStorageKeys.lskTrustedBots]: uint64Field('trustedBots'),
    [LocalStorageKeys.lskRecentStickersOld]: uint64Field('recentStickersOld'),
    [LocalStorageKeys.lskBackgroundOldOld]: uint64Field('backgroundOldOld'),
    [LocalStorageKeys.lskBackgroundOld](reader: QtReader) {
        return {
            _: 'backgroundOld' as const,
            legacyBackgroundKeyDay: reader.uint64(),
            legacyBackgroundKeyNight: reader.uint64(),
        }
    },
    [LocalStorageKeys.lskUserSettings]: uint64Field('userSettings'),
    [LocalStorageKeys.lskRecentHashtagsAndBots]: uint64Field(
        'recentHashtagsAndBots'
    ),
    [LocalStorageKeys.lskStickersOld]: uint64Field('stickersOld'),
    [LocalStorageKeys.lskStickersKeys](reader: QtReader) {
        return {
            _: 'stickersKeys' as const,
            installedStickersKey: reader.uint64(),
            featuredStickersKey: reader.uint64(),
            recentStickersKey: reader.uint64(),
            archivedStickersKey: reader.uint64(),
        }
    },
    [LocalStorageKeys.lskFavedStickers]: uint64Field('favedStickers'),
    [LocalStorageKeys.lskSavedGifsOld]: uint64Field('savedGifsOld'),
    [LocalStorageKeys.lskSavedGifs]: uint64Field('savedGifs'),
    [LocalStorageKeys.lskSavedPeersOld]: uint64Field('savedPeersOld'),
    [LocalStorageKeys.lskExportSettings]: uint64Field('exportSettings'),
    [LocalStorageKeys.lskMasksKeys](reader: QtReader) {
        return {
            _: 'masksKeys' as const,
            installedMasksKey: reader.uint64(),
            recentMasksKey: reader.uint64(),
            archivedMasksKey: reader.uint64(),
        }
    },
} as const

export type LocalStorageField = Exclude<
    ReturnType<typeof lsBlockReaders[keyof typeof lsBlockReaders]>,
    void
>

export function findLsField<T extends LocalStorageField['_']>(
    fields: LocalStorageField[],
    name: T
): Extract<LocalStorageField, { _: T }> {
    return fields.find((it) => it._ === name) as any
}
