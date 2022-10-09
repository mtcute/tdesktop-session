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

export interface InputTdKeyData {
    localKey?: Buffer
    count: number
    order: number[]
    active: number
}

export interface TdKeyData extends InputTdKeyData {
    localKey: Buffer
}
