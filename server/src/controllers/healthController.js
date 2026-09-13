import { checkDiskSpace } from '../utils/diskMonitor.js';

export async function liveness(req, res) {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

export async function readiness(req, res) {
  try {
    const disk = await checkDiskSpace();
    if (!disk.hasSpace) {
      return res.status(503).json({
        status: 'DOWN',
        reason: 'Low disk space',
        freeBytes: disk.freeBytes
      });
    }

    res.status(200).json({
      status: 'READY',
      timestamp: new Date().toISOString(),
      disk: {
        freeBytes: disk.freeBytes,
        totalBytes: disk.totalBytes
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      error: error.message
    });
  }
}
