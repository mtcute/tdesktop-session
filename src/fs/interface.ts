/**
 * Base interface for file system access
 * Filenames are relative to `tdata/` folder.
 */
export interface FsAccessInterface {
    stat(filename: string): Promise<{ lastModified: number } | null>
    readFile(filename: string): Promise<Buffer>
    writeFile(filename: string, data: Buffer): Promise<void>
    writeFile(filename: string, data: Buffer, createFolder?: boolean): Promise<void>
}