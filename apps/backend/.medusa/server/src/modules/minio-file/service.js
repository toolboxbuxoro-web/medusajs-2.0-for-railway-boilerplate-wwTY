"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const minio_1 = require("minio");
const path_1 = __importDefault(require("path"));
const ulid_1 = require("ulid");
const DEFAULT_BUCKET = 'medusa-media';
/**
 * Service to handle file storage using MinIO.
 */
class MinioFileProviderService extends utils_1.AbstractFileProviderService {
    static identifier = 'minio-file';
    config_;
    logger_;
    client;
    bucket;
    constructor({ logger }, options) {
        super();
        this.logger_ = logger;
        this.config_ = {
            endPoint: options.endPoint,
            accessKey: options.accessKey,
            secretKey: options.secretKey,
            bucket: options.bucket
        };
        // Use provided bucket or default
        this.bucket = this.config_.bucket || DEFAULT_BUCKET;
        this.logger_.info(`MinIO service initialized with bucket: ${this.bucket}`);
        // Initialize Minio client with hardcoded SSL settings
        this.client = new minio_1.Client({
            endPoint: this.config_.endPoint,
            port: 443,
            useSSL: true,
            accessKey: this.config_.accessKey,
            secretKey: this.config_.secretKey
        });
        // Initialize bucket and policy
        this.initializeBucket().catch(error => {
            this.logger_.error(`Failed to initialize MinIO bucket: ${error.message}`);
        });
    }
    static validateOptions(options) {
        const requiredFields = [
            'endPoint',
            'accessKey',
            'secretKey'
        ];
        requiredFields.forEach((field) => {
            if (!options[field]) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `${field} is required in the provider's options`);
            }
        });
    }
    async initializeBucket() {
        try {
            // Check if bucket exists
            const bucketExists = await this.client.bucketExists(this.bucket);
            if (!bucketExists) {
                // Create the bucket
                await this.client.makeBucket(this.bucket);
                this.logger_.info(`Created bucket: ${this.bucket}`);
                // Set bucket policy to allow public read access
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Sid: 'PublicRead',
                            Effect: 'Allow',
                            Principal: '*',
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${this.bucket}/*`]
                        }
                    ]
                };
                await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
                this.logger_.info(`Set public read policy for bucket: ${this.bucket}`);
            }
            else {
                this.logger_.info(`Using existing bucket: ${this.bucket}`);
                // Verify/update policy on existing bucket
                try {
                    const policy = {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Sid: 'PublicRead',
                                Effect: 'Allow',
                                Principal: '*',
                                Action: ['s3:GetObject'],
                                Resource: [`arn:aws:s3:::${this.bucket}/*`]
                            }
                        ]
                    };
                    await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
                    this.logger_.info(`Updated public read policy for existing bucket: ${this.bucket}`);
                }
                catch (policyError) {
                    this.logger_.warn(`Failed to update policy for existing bucket: ${policyError.message}`);
                }
            }
        }
        catch (error) {
            this.logger_.error(`Error initializing bucket: ${error.message}`);
            throw error;
        }
    }
    async upload(file) {
        if (!file) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, 'No file provided');
        }
        if (!file.filename) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, 'No filename provided');
        }
        try {
            const parsedFilename = path_1.default.parse(file.filename);
            const fileKey = `${parsedFilename.name}-${(0, ulid_1.ulid)()}${parsedFilename.ext}`;
            const content = Buffer.from(file.content, 'binary');
            // Upload file with public-read access
            await this.client.putObject(this.bucket, fileKey, content, content.length, {
                'Content-Type': file.mimeType,
                'x-amz-meta-original-filename': file.filename,
                'x-amz-acl': 'public-read'
            });
            // Generate URL using the endpoint and bucket
            const url = `https://${this.config_.endPoint}/${this.bucket}/${fileKey}`;
            this.logger_.info(`Successfully uploaded file ${fileKey} to MinIO bucket ${this.bucket}`);
            return {
                url,
                key: fileKey
            };
        }
        catch (error) {
            this.logger_.error(`Failed to upload file: ${error.message}`);
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to upload file: ${error.message}`);
        }
    }
    async delete(fileData) {
        const files = Array.isArray(fileData) ? fileData : [fileData];
        for (const file of files) {
            if (!file?.fileKey) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, 'No file key provided');
            }
            try {
                await this.client.removeObject(this.bucket, file.fileKey);
                this.logger_.info(`Successfully deleted file ${file.fileKey} from MinIO bucket ${this.bucket}`);
            }
            catch (error) {
                this.logger_.warn(`Failed to delete file ${file.fileKey}: ${error.message}`);
            }
        }
    }
    async getPresignedDownloadUrl(fileData) {
        if (!fileData?.fileKey) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, 'No file key provided');
        }
        try {
            const url = await this.client.presignedGetObject(this.bucket, fileData.fileKey, 24 * 60 * 60 // URL expires in 24 hours
            );
            this.logger_.info(`Generated presigned URL for file ${fileData.fileKey}`);
            return url;
        }
        catch (error) {
            this.logger_.error(`Failed to generate presigned URL: ${error.message}`);
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to generate presigned URL: ${error.message}`);
        }
    }
    async getPresignedUploadUrl(fileData) {
        if (!fileData?.filename) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, 'No filename provided');
        }
        try {
            // Use the filename directly as the key (matches S3 provider behavior for presigned uploads)
            const fileKey = fileData.filename;
            // Generate presigned PUT URL that expires in 15 minutes
            const url = await this.client.presignedPutObject(this.bucket, fileKey, 15 * 60 // URL expires in 15 minutes
            );
            return {
                url,
                key: fileKey
            };
        }
        catch (error) {
            this.logger_.error(`Failed to generate presigned upload URL: ${error.message}`);
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to generate presigned upload URL: ${error.message}`);
        }
    }
    async getAsBuffer(fileData) {
        if (!fileData?.fileKey) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, 'No file key provided');
        }
        try {
            const stream = await this.client.getObject(this.bucket, fileData.fileKey);
            const buffer = await new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
            this.logger_.info(`Retrieved buffer for file ${fileData.fileKey}`);
            return buffer;
        }
        catch (error) {
            this.logger_.error(`Failed to get buffer: ${error.message}`);
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to get buffer: ${error.message}`);
        }
    }
    async getDownloadStream(fileData) {
        if (!fileData?.fileKey) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, 'No file key provided');
        }
        try {
            // Get the MinIO stream directly
            const minioStream = await this.client.getObject(this.bucket, fileData.fileKey);
            this.logger_.info(`Retrieved download stream for file ${fileData.fileKey}`);
            return minioStream;
        }
        catch (error) {
            this.logger_.error(`Failed to get download stream: ${error.message}`);
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to get download stream: ${error.message}`);
        }
    }
}
exports.default = MinioFileProviderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL21pbmlvLWZpbGUvc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHFEQUFxRjtBQVNyRixpQ0FBK0I7QUFDL0IsZ0RBQXdCO0FBQ3hCLCtCQUE0QjtBQXFCNUIsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFBO0FBRXJDOztHQUVHO0FBQ0gsTUFBTSx3QkFBeUIsU0FBUSxtQ0FBMkI7SUFDaEUsTUFBTSxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUE7SUFDYixPQUFPLENBQW9CO0lBQzNCLE9BQU8sQ0FBUTtJQUN4QixNQUFNLENBQVE7SUFDTCxNQUFNLENBQVE7SUFFakMsWUFBWSxFQUFFLE1BQU0sRUFBd0IsRUFBRSxPQUFpQztRQUM3RSxLQUFLLEVBQUUsQ0FBQTtRQUNQLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO1FBQ3JCLElBQUksQ0FBQyxPQUFPLEdBQUc7WUFDYixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7WUFDMUIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTO1lBQzVCLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztZQUM1QixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07U0FDdkIsQ0FBQTtRQUVELGlDQUFpQztRQUNqQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLGNBQWMsQ0FBQTtRQUNuRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQywwQ0FBMEMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFFMUUsc0RBQXNEO1FBQ3RELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxjQUFNLENBQUM7WUFDdkIsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUTtZQUMvQixJQUFJLEVBQUUsR0FBRztZQUNULE1BQU0sRUFBRSxJ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