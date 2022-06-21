// from https://github.com/telegramdesktop/tdesktop/blob/dev/Telegram/SourceFiles/storage/details/storage_settings_scheme.h

import { tl } from '@mtcute/core'
import { QtReader } from '../qt-reader'
import Long from 'long'
import {booleanField, bytesField, int32Field, stringField, uint64Field} from "./utils";

export enum SettingsBlockId {
    dbiKey = 0x00,
    dbiUser = 0x01,
    dbiDcOptionOldOld = 0x02,
    dbiChatSizeMaxOld = 0x03,
    dbiMutePeerOld = 0x04,
    dbiSendKeyOld = 0x05,
    dbiAutoStart = 0x06,
    dbiStartMinimized = 0x07,
    dbiSoundFlashBounceNotifyOld = 0x08,
    dbiWorkModeOld = 0x09,
    dbiSeenTrayTooltip = 0x0a,
    dbiDesktopNotifyOld = 0x0b,
    dbiAutoUpdate = 0x0c,
    dbiLastUpdateCheck = 0x0d,
    dbiWindowPositionOld = 0x0e,
    dbiConnectionTypeOldOld = 0x0f,
    // 0x10 reserved
    dbiDefaultAttach = 0x11,
    dbiCatsAndDogsOld = 0x12,
    dbiReplaceEmojiOld = 0x13,
    dbiAskDownloadPathOld = 0x14,
    dbiDownloadPathOldOld = 0x15,
    dbiScaleOld = 0x16,
    dbiEmojiTabOld = 0x17,
    dbiRecentEmojiOldOldOld = 0x18,
    dbiLoggedPhoneNumberOld = 0x19,
    dbiMutedPeersOld = 0x1a,
    // 0x1b reserved
    dbiNotifyViewOld = 0x1c,
    dbiSendToMenu = 0x1d,
    dbiCompressPastedImageOld = 0x1e,
    dbiLangOld = 0x1f,
    dbiLangFileOld = 0x20,
    dbiTileBackgroundOld = 0x21,
    dbiAutoLockOld = 0x22,
    dbiDialogLastPath = 0x23,
    dbiRecentEmojiOldOld = 0x24,
    dbiEmojiVariantsOldOld = 0x25,
    dbiRecentStickers = 0x26,
    dbiDcOptionOld = 0x27,
    dbiTryIPv6Old = 0x28,
    dbiSongVolumeOld = 0x29,
    dbiWindowsNotificationsOld = 0x30,
    dbiIncludeMutedOld = 0x31,
    dbiMegagroupSizeMaxOld = 0x32,
    dbiDownloadPathOld = 0x33,
    dbiAutoDownloadOld = 0x34,
    dbiSavedGifsLimitOld = 0x35,
    dbiShowingSavedGifsOld = 0x36,
    dbiAutoPlayOld = 0x37,
    dbiAdaptiveForWideOld = 0x38,
    dbiHiddenPinnedMessagesOld = 0x39,
    dbiRecentEmojiOld = 0x3a,
    dbiEmojiVariantsOld = 0x3b,
    dbiDialogsModeOld = 0x40,
    dbiModerateModeOld = 0x41,
    dbiVideoVolumeOld = 0x42,
    dbiStickersRecentLimitOld = 0x43,
    dbiNativeNotificationsOld = 0x44,
    dbiNotificationsCountOld = 0x45,
    dbiNotificationsCornerOld = 0x46,
    dbiThemeKeyOld = 0x47,
    dbiDialogsWidthRatioOld = 0x48,
    dbiUseExternalVideoPlayer = 0x49,
    dbiDcOptionsOld = 0x4a,
    dbiMtpAuthorization = 0x4b,
    dbiLastSeenWarningSeenOld = 0x4c,
    dbiSessionSettings = 0x4d,
    dbiLangPackKey = 0x4e,
    dbiConnectionTypeOld = 0x4f,
    dbiStickersFavedLimitOld = 0x50,
    dbiSuggestStickersByEmojiOld = 0x51,
    dbiSuggestEmojiOld = 0x52,
    dbiTxtDomainStringOldOld = 0x53,
    dbiThemeKey = 0x54,
    dbiTileBackground = 0x55,
    dbiCacheSettingsOld = 0x56,
    dbiAnimationsDisabled = 0x57,
    dbiScalePercent = 0x58,
    dbiPlaybackSpeedOld = 0x59,
    dbiLanguagesKey = 0x5a,
    dbiCallSettingsOld = 0x5b,
    dbiCacheSettings = 0x5c,
    dbiTxtDomainStringOld = 0x5d,
    dbiApplicationSettings = 0x5e,
    dbiDialogsFiltersOld = 0x5f,
    dbiFallbackProductionConfig = 0x60,
    dbiBackgroundKey = 0x61,

    dbiEncryptedWithSalt = 333,
    dbiEncrypted = 444,

    // 500-600 reserved

    dbiVersion = 666,
}

// from https://github.com/telegramdesktop/tdesktop/blob/dev/Telegram/SourceFiles/storage/details/storage_settings_scheme.cpp
export const settingsBlockReaders = {
    [SettingsBlockId.dbiAutoStart]: booleanField('autoStart'),
    [SettingsBlockId.dbiStartMinimized]: booleanField('startMinimized'),
    [SettingsBlockId.dbiSendToMenu]: booleanField('sendToMenu'),
    [SettingsBlockId.dbiUseExternalVideoPlayer]: booleanField(
        'useExternalVideoPlayer'
    ),
    [SettingsBlockId.dbiSeenTrayTooltip]: booleanField('seenTrayTooltip'),
    [SettingsBlockId.dbiAutoUpdate]: booleanField('autoUpdate'),
    [SettingsBlockId.dbiTryIPv6Old]: booleanField('tryIPv6Old'),
    [SettingsBlockId.dbiAnimationsDisabled]: booleanField('animationsDisabled'),
    [SettingsBlockId.dbiLastUpdateCheck]: int32Field('lastUpdateCheck'),
    [SettingsBlockId.dbiScalePercent]: int32Field('scalePercent'),
    [SettingsBlockId.dbiFallbackProductionConfig]: bytesField(
        'fallbackProductionConfig'
    ),
    [SettingsBlockId.dbiApplicationSettings]: bytesField('applicationSettings'),
    [SettingsBlockId.dbiDcOptionsOld]: bytesField('dcOptionsOld'),
    [SettingsBlockId.dbiDialogLastPath]: stringField('dialogLastPath'),
    [SettingsBlockId.dbiLangPackKey]: uint64Field('langPackKey'),
    [SettingsBlockId.dbiSessionSettings]: bytesField('sessionSettings'),
    [SettingsBlockId.dbiRecentStickers]: bytesField('recentStickers'),
    [SettingsBlockId.dbiMtpAuthorization]: bytesField('mtpAuthorization'),
    [SettingsBlockId.dbiDcOptionOldOld](reader: QtReader) {
        const dcId = reader.uint32()
        // skip host
        reader.qString()
        const ip = reader.qString()
        const port = reader.uint32()

        const obj: tl.RawDcOption = {
            _: 'dcOption',
            id: dcId,
            ipAddress: ip,
            port,
        }
        return obj
    },
    [SettingsBlockId.dbiDcOptionOld](reader: QtReader) {
        // idk what "shift" is
        const dcIdWithShift = reader.uint32()
        const flags = reader.int32()
        const ip = reader.qString()
        const port = reader.uint32()

        const obj: tl.RawDcOption & { flags: number } = {
            _: 'dcOption',
            flags,
            id: dcIdWithShift,
            ipAddress: ip,
            port,
        }
        return obj
    },
    [SettingsBlockId.dbiThemeKey](reader: QtReader) {
        const keyDay = reader.uint64()
        const keyNight = reader.uint64()
        const nightMode = reader.int32()
        return {
            _: 'themeKey' as const,
            themeKeyDay: keyDay,
            themeKeyNight: keyNight,
            nightMode,
        }
    },
    [SettingsBlockId.dbiBackgroundKey](reader: QtReader) {
        const keyDay = reader.uint64()
        const keyNight = reader.uint64()
        return {
            _: 'backgroundKey' as const,
            backgroundKeyDay: keyDay,
            backgroundKeyNight: keyNight,
        }
    },
    [SettingsBlockId.dbiTileBackground](reader: QtReader) {
        const tileDay = reader.uint32()
        const tileNight = reader.uint32()
        return {
            _: 'tileBackground' as const,
            tileDay,
            tileNight,
        }
    },
    [SettingsBlockId.dbiCacheSettings](reader: QtReader) {
        const size = reader.int64()
        const sizeBig = reader.int64()
        const time = reader.uint32()
        const timeBig = reader.uint32()
        return {
            _: 'cacheSettings' as const,
            size,
            sizeBig,
            time,
            timeBig,
        }
    }
} as const

export function readSetting(reader: QtReader): SettingsField {
    const blockId = reader.uint32()
    const fn = (settingsBlockReaders as any)[blockId]

    if (!fn) {
        throw new Error(
            `Unknown block ${blockId} (0x${blockId.toString(16)})`
        )
    }

    return fn(reader)
}

export type SettingsField = ReturnType<
    typeof settingsBlockReaders[keyof typeof settingsBlockReaders]
>
