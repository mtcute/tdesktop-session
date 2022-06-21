import { FsAccessInterface } from './interface'

export class InMemoryFs implements FsAccessInterface {
    private _files: Record<string, [number, Buffer]> = {}

    addFile(filename: string, contents: Buffer, lastModified?: number) {
        this._files[filename] = [lastModified ?? Date.now(), contents]
    }

    readFile(filename: string): Promise<Buffer> {
        const file = this._files[filename]
        if (!file) throw new Error('File not found')
        return Promise.resolve(file[1])
    }

    stat(filename: string): Promise<{ lastModified: number } | null> {
        const file = this._files[filename]
        if (!file) return Promise.resolve(null)

        return Promise.resolve({
            lastModified: file[0]
        })
    }

    writeFile(filename: string, data: Buffer): Promise<void> {
        this.addFile(filename, data)
        return Promise.resolve()
    }

}
