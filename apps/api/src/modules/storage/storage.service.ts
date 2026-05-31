import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get('STORAGE_ENDPOINT') || config.get('MINIO_ENDPOINT') || 'http://minio:9000';
    const region = config.get('STORAGE_REGION') || 'us-east-1';

    this.s3 = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: config.get('STORAGE_ACCESS_KEY') || config.get('MINIO_ACCESS_KEY') || 'minioadmin',
        secretAccessKey: config.get('STORAGE_SECRET_KEY') || config.get('MINIO_SECRET_KEY') || 'minioadmin',
      },
      forcePathStyle: true,
    });

    this.bucket = config.get('STORAGE_BUCKET') || 'godream';
    this.publicUrl = config.get('STORAGE_PUBLIC_URL') || endpoint;
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    acl?: string,
  ): Promise<{ url: string; key: string }> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ...(acl ? { ACL: acl as any } : {}),
    }));

    return { url: `${this.publicUrl}/${this.bucket}/${key}`, key };
  }

  async delete(url: string): Promise<void> {
    try {
      const key = url.split(`/${this.bucket}/`)[1];
      if (!key) return;
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.error(`Failed to delete file: ${url}`, err);
    }
  }

  async getSignedUploadUrl(key: string, mimeType: string, expiresIn = 300): Promise<{ url: string; objectKey: string }> {
    const objectKey = `${key}-${uuidv4()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: mimeType,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn });
    return { url, objectKey };
  }
}
