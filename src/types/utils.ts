import { QtReader } from '../qt-reader'

export const booleanField =
    <T extends string>(name: T) =>
    (reader: QtReader) => {
        return {
            _: name,
            value: reader.int32() === 1,
        }
    }

export const int32Field =
    <T extends string>(name: T) =>
    (reader: QtReader) => {
        return {
            _: name,
            value: reader.int32(),
        }
    }

export const uint64Field =
    <T extends string>(name: T) =>
    (reader: QtReader) => {
        return {
            _: name,
            value: reader.uint64(),
        }
    }

export const stringField =
    <T extends string>(name: T) =>
    (reader: QtReader) => {
        return {
            _: name,
            value: reader.qString(),
        }
    }

export const bytesField =
    <T extends string>(name: T) =>
    (reader: QtReader) => {
        return {
            _: name,
            value: reader.qByteArray(),
        }
    }
