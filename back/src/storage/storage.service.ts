import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { appConfig } from '../core/config/app.config';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;

  constructor(private prisma: PrismaService) {
    this.bucket = appConfig.s3.bucket;

    if (this.shouldSign()) {
      this.s3 = new S3Client({
        region: appConfig.s3.region,
        endpoint: appConfig.s3.endpoint,
        credentials: {
          accessKeyId: appConfig.s3.accessKey,
          secretAccessKey: appConfig.s3.secretKey,
        },
        forcePathStyle: true,
      });
    }
  }

  shouldSign(): boolean {
    return !!appConfig.s3.bucket;
  }

  async uploadFile(
    buffer: Buffer,
    mimetype: string,
    originalName: string,
    userId: string,
    roomId: string,
  ): Promise<{ id: string; key: string; url: string }> {
    const filename = uuid();
    const extension = path.extname(originalName);
    const key = `chat-api/${filename}`;
    const expiresIn = 300;

    let url: string;

    if (!this.shouldSign()) {
      const uploadsDir = path.resolve(appConfig.uploadsDir);
      const localPath = path.join(uploadsDir, filename + extension);

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      fs.writeFileSync(localPath, buffer);
      url = `${appConfig.urlBase}/uploads/${filename + extension}`;

      return this.saveAndReturn(
        key,
        filename,
        originalName,
        mimetype,
        expiresIn,
        userId,
        roomId,
        url,
      );
    } else {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimetype,
        }),
      );
      url = await this.generatePresignedUrl(key, expiresIn);
    }

    const storage = await this.saveStorage({
      key,
      filename,
      originalName,
      mimetype,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      userId,
      roomId,
      url,
    });

    return {
      id: storage.id,
      key,
      url,
    };
  }

  private async saveAndReturn(
    key: string,
    filename: string,
    originalName: string,
    mimetype: string,
    expiresIn: number,
    userId: string,
    roomId: string,
    url: string,
  ) {
    const storage = await this.saveStorage({
      key,
      filename,
      originalName,
      mimetype,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      userId,
      roomId,
      url,
    });

    return {
      id: storage.id,
      key,
      url,
    };
  }

  private async saveStorage(data: {
    key: string;
    filename: string;
    originalName: string;
    mimetype: string;
    expiresAt: Date;
    userId: string;
    roomId: string;
    url: string;
  }) {
    const storage = await this.prisma.storage.create({ data });
    return storage;
  }

  async generatePresignedUrl(
    key: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
