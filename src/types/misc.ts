import Long from 'long'

export interface TdAuthKey {
    dcId: number
    key: Buffer
}

export interface TdMtpAuthorization {
    userId: Long
    mainDcId: number
    authKeys: TdAuthKey[]
    authKeysToDestroy: TdAuthKey[]
}

export interface TdKeyData {
    localKey: Buffer
    count: number
    order: number[]
    active: number
}
