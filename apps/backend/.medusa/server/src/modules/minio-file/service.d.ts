import { AbstractFileProviderService } from '@medusajs/framework/utils';
import { Logger } from '@medusajs/framework/types';
import { ProviderUploadFileDTO, ProviderDeleteFileDTO, ProviderFileResultDTO, ProviderGetFileDTO, ProviderGetPresignedUploadUrlDTO } from '@medusajs/framework/types';
import { Client } from 'minio';
import { Readable } from 'stream';
type InjectedDependencies = {
    logger: Logger;
};
interface MinioServiceConfig {
    endPoint: string;
    accessKey: string;
    secretKey: string;
    bucket?: string;
}
export interface MinioFileProviderOptions {
    endPoint: string;
    accessKey: string;
    secretKey: string;
    bucket?: string;
}
/**
 * Service to handle file storage using MinIO.
 */
declare class MinioFileProviderService extends AbstractFileProviderService {
    static identifier: string;
    protected readonly config_: MinioServiceConfig;
    protected readonly logger_: Logger;
    protected client: Client;
    protected readonly bucket: string;
    constructor({ logger }: InjectedDependencies, options: MinioFileProviderOptions);
    static validateOptions(options: Record<string, any>): void;
    private initializeBucket;
    upload(file: ProviderUploadFileDTO): Promise<ProviderFileResultDTO>;
    delete(fileData: ProviderDeleteFileDTO | ProviderDeleteFileDTO[]): Promise<void>;
    getPresignedDownloadUrl(fileData: ProviderGetFileDTO): Promise<string>;
    getPresignedUploadUrl(fileData: ProviderGetPresignedUploadUrlDTO): Promise<ProviderFileResultDTO>;
    getAsBuffer(fileData: ProviderGetFileDTO): Promise<Buffer>;
    getDownloadStream(fileData: ProviderGetFileDTO): Promise<Readable>;
}
export default MinioFileProviderService;
