import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Resource Limits
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || `${5 * 1024 * 1024 * 1024}`, 10), // 5GB default
  maxFilesPerTransfer: parseInt(process.env.MAX_FILES_PER_TRANSFER || '50', 10),
  maxChunkSize: parseInt(process.env.MAX_CHUNK_SIZE || `${2 * 1024 * 1024}`, 10), // 2MB default chunk
  maxConcurrentTransfers: parseInt(process.env.MAX_CONCURRENT_TRANSFERS || '10', 10),
  maxConnectionsPerIp: parseInt(process.env.MAX_CONNECTIONS_PER_IP || '50', 10),

  // Session & Transfer Expirations
  sessionExpirySeconds: parseInt(process.env.SESSION_EXPIRY || '600', 10), // 10 mins
  transferExpirySeconds: parseInt(process.env.TRANSFER_EXPIRY || '3600', 10), // 1 hour

  // Directories
  uploadDir: process.env.UPLOAD_DIRECTORY || path.resolve(__dirname, '../../../uploads_temp'),

  // Redis (Optional)
  redisUrl: process.env.REDIS_URL || null,

  // Disk Safety Threshold (Percentage of free disk space required minimum)
  minDiskSpaceBytes: parseInt(process.env.MIN_DISK_SPACE_BYTES || `${500 * 1024 * 1024}`, 10) // 500 MB min free
};
