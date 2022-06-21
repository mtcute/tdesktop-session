import {ICryptoProvider, NodeCryptoProvider} from '@mtcute/core'
import { MaybeAsync } from '@mtcute/core/types'
import { createHash } from 'crypto'

export interface ITdCryptoProvider extends ICryptoProvider {
    sha512(data: Buffer): MaybeAsync<Buffer>
}

export type TdCryptoProviderFactory = () => ITdCryptoProvider;


export class TdNodeCryptoProvider extends NodeCryptoProvider implements ITdCryptoProvider {
    sha512(data: Buffer): MaybeAsync<Buffer> {
        return createHash('sha512').update(data).digest()
    }
}
