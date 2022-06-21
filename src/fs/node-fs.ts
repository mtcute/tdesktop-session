import { mkdir, readFile, stat, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { FsAccessInterface } from './interface'

export class NodeFsAccess implements FsAccessInterface {
    constructor(readonly tdataPath: string) {
    }
    
    async stat(filename: string) {
        try {
            const s = await stat(join(this.tdataPath, filename))
            
            return {
                lastModified: s.mtimeMs
            }
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                return null
            }
            
            throw e
        }
    }

    readFile(filename: string): Promise<Buffer> {
        return readFile(join(this.tdataPath, filename))
    }

    async writeFile(filename: string, data: Buffer, createFolder = false): Promise<void> {
        if (createFolder) {
            await mkdir(join(this.tdataPath, dirname(filename)), { recursive: true })
        }
        
        return writeFile(join(this.tdataPath, filename), data)
    }
}
