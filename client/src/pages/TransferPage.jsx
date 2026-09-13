import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';
import { TransferUploader } from '../services/transferManager.js';
import { Header } from '../components/Header.jsx';
import { DropZone } from '../components/DropZone.jsx';
import { FileList } from '../components/FileList.jsx';
import { TransferProgress } from '../components/TransferProgress.jsx';
import { TextShare } from '../components/TextShare.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ArrowLeft, FileText, Upload } from 'lucide-react';

export function TransferPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const role = location.state?.role || 'guest';
  const code = location.state?.code || '';

  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'text'
  const [connState, setConnState] = useState('CONNECTED');
  const [filesList, setFilesList] = useState([]);
  const [currentTransfer, setCurrentTransfer] = useState(null);
  const [activeUploader, setActiveUploader] = useState(null);
  const [receivedText, setReceivedText] = useState('');

  useEffect(() => {
    if (!wsClient.sessionId) {
      wsClient.connect(sessionId, role);
    }

    const unsubState = wsClient.onStateChange((state) => {
      setConnState(state);
    });

    const unsubInit = wsClient.on('TRANSFER_INIT', (data) => {
      const payload = data.payload || data;
      addToast(`Receiving offer for ${payload.fileName}...`, 'info');
      setFilesList((prev) => [
        ...prev,
        {
          id: payload.transferId,
          name: payload.fileName,
          size: payload.fileSize,
          status: 'TRANSFERRING',
          progress: 0
        }
      ]);
    });

    const unsubProgress = wsClient.on('TRANSFER_PROGRESS', (data) => {
      const payload = data.payload || data;
      setFilesList((prev) =>
        prev.map((f) => (f.id === payload.transferId ? { ...f, progress: payload.progress } : f))
      );
    });

    const unsubComplete = wsClient.on('TRANSFER_COMPLETE', (data) => {
      const payload = data.payload || data;
      addToast(`File ${payload.fileName} transfer complete!`, 'success');
      setFilesList((prev) =>
        prev.map((f) =>
          f.id === payload.transferId
            ? { ...f, status: 'COMPLETED', progress: 100, downloadUrl: api.getDownloadUrl(payload.transferId) }
            : f
        )
      );
    });

    const unsubText = wsClient.on('TRANSFER_INIT', (data) => {
      const payload = data.payload || data;
      if (payload.isText) {
        setReceivedText(payload.textContent);
        addToast('Received text snippet from peer!', 'success');
      }
    });

    return () => {
      if (unsubState) unsubState();
      if (unsubInit) unsubInit();
      if (unsubProgress) unsubProgress();
      if (unsubComplete) unsubComplete();
      if (unsubText) unsubText();
    };
  }, [sessionId]);

  const handleFilesSelected = async (selectedFiles) => {
    for (const file of selectedFiles) {
      const fileId = Date.now().toString() + Math.random();
      
      const newFileItem = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'TRANSFERRING',
        progress: 0
      };

      setFilesList((prev) => [...prev, newFileItem]);

      const uploader = new TransferUploader(
        file,
        sessionId,
        2 * 1024 * 1024,
        (progressInfo) => {
          setCurrentTransfer({
            fileName: file.name,
            totalBytes: file.size,
            ...progressInfo,
            status: 'TRANSFERRING'
          });
          setFilesList((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress: progressInfo.progress } : f))
          );
        },
        (error) => {
          addToast(`Upload error: ${error.message}`, 'error');
          setCurrentTransfer((prev) => (prev ? { ...prev, status: 'FAILED' } : null));
          setFilesList((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, status: 'FAILED' } : f))
          );
        },
        (completedTransfer) => {
          addToast(`File ${file.name} uploaded successfully!`, 'success');
          setCurrentTransfer((prev) => (prev ? { ...prev, status: 'COMPLETED', progress: 100 } : null));
          setFilesList((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: 'COMPLETED',
                    progress: 100,
                    downloadUrl: api.getDownloadUrl(completedTransfer.transferId)
                  }
                : f
            )
          );
        }
      );

      setActiveUploader(uploader);
      await uploader.start();
    }
  };

  const handleSendText = async (textPayload) => {
    try {
      const res = await api.createTransfer({
        sessionId,
        isText: true,
        textContent: textPayload
      });
      
      wsClient.send('TRANSFER_INIT', {
        transferId: res.transferId,
        isText: true,
        textContent: textPayload
      });
    } catch (e) {
      addToast(e.message || 'Failed to send text', 'error');
    }
  };

  const handleDownload = (fileItem) => {
    if (fileItem.downloadUrl) {
      window.open(fileItem.downloadUrl, '_blank');
    }
  };

  return (
    <>
      <Header connectionState={connState} />
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
        
        {/* Navigation / Header info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            <ArrowLeft size={16} /> Exit Room
          </button>
          
          {code && (
            <div style={{ background: 'var(--card-bg)', padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid var(--card-border)', fontSize: '0.9rem', fontWeight: '600' }}>
              Code: <span style={{ color: 'var(--accent-color)' }}>{code}</span>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-tertiary)', padding: '0.3rem', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('files')}
            className={`btn-secondary`}
            style={{
              flex: 1,
              background: activeTab === 'files' ? 'var(--accent-gradient)' : 'transparent',
              color: activeTab === 'files' ? '#fff' : 'var(--text-secondary)',
              border: 'none'
            }}
          >
            <Upload size={16} /> File Sharing
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`btn-secondary`}
            style={{
              flex: 1,
              background: activeTab === 'text' ? 'var(--accent-gradient)' : 'transparent',
              color: activeTab === 'text' ? '#fff' : 'var(--text-secondary)',
              border: 'none'
            }}
          >
            <FileText size={16} /> Text Sharing
          </button>
        </div>

        {/* Main Content Area */}
        {activeTab === 'files' ? (
          <div>
            <DropZone onFilesSelected={handleFilesSelected} />

            {currentTransfer && (
              <div style={{ marginBottom: '1.5rem' }}>
                <TransferProgress
                  fileName={currentTransfer.fileName}
                  progress={currentTransfer.progress}
                  uploadedBytes={currentTransfer.uploadedBytes}
                  totalBytes={currentTransfer.totalBytes}
                  speed={currentTransfer.speed}
                  eta={currentTransfer.eta}
                  status={currentTransfer.status}
                  onPause={() => activeUploader?.pause()}
                  onResume={() => activeUploader?.resume()}
                  onCancel={() => activeUploader?.cancel()}
                />
              </div>
            )}

            <FileList files={filesList} onDownload={handleDownload} />
          </div>
        ) : (
          <TextShare onSendText={handleSendText} receivedText={receivedText} />
        )}
      </div>
    </>
  );
}
