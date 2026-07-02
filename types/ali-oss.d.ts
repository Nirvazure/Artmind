declare module 'ali-oss' {
  interface OSSOptions {
    region: string
    bucket: string
    accessKeyId: string
    accessKeySecret: string
  }

  export default class OSS {
    constructor(options: OSSOptions)
    put(name: string, buffer: Buffer): Promise<unknown>
    copy(dest: string, source: string): Promise<unknown>
  }
}
