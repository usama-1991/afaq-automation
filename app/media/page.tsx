'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Folder, Image as ImageIcon, FileText, Video as VideoIcon, Music, 
  Upload, Search, Copy, Trash2, Globe, File, Plus, X, Check 
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  category: 'Images' | 'Documents' | 'Videos' | 'Audio';
  size: string;
  url: string;
  addedAt: string;
}

const defaultMedia: MediaFile[] = [];

export default function MediaPage() {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Images' | 'Documents' | 'Videos' | 'Audio'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Custom mock file upload state
  const [isDragging, setIsDragging] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'Images' | 'Documents' | 'Videos' | 'Audio'>('Images');
  const [uploadSize, setUploadSize] = useState('450 KB');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('autoflow_media_library');
    if (stored) {
      try {
        setMediaList(JSON.parse(stored));
      } catch (e) {
        setMediaList([]);
      }
    } else {
      setMediaList([]);
      localStorage.setItem('autoflow_media_library', JSON.stringify([]));
    }
  }, []);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDeleteMedia = (id: string) => {
    const updated = mediaList.filter(m => m.id !== id);
    setMediaList(updated);
    localStorage.setItem('autoflow_media_library', JSON.stringify(updated));
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName) return;

    // Generate beautiful public URL mock
    const cleanName = uploadName.toLowerCase().replace(/[^a-z0-9_.]/g, '_');
    const mockUrl = `https://app.autoflow.ai/media/${cleanName}`;

    const newFile: MediaFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: uploadName,
      category: uploadCategory,
      size: uploadSize,
      url: mockUrl,
      addedAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newFile, ...mediaList];
    setMediaList(updated);
    localStorage.setItem('autoflow_media_library', JSON.stringify(updated));
    setShowAddModal(false);
    setUploadName('');
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Auto-populate form details
      setUploadName(file.name);
      
      // Auto-detect category
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
        setUploadCategory('Images');
      } else if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) {
        setUploadCategory('Videos');
      } else if (['mp3', 'wav', 'ogg', 'aac'].includes(ext || '')) {
        setUploadCategory('Audio');
      } else {
        setUploadCategory('Documents');
      }

      // Format size
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb >= 1) {
        setUploadSize(`${sizeMb.toFixed(1)} MB`);
      } else {
        setUploadSize(`${(file.size / 1024).toFixed(0)} KB`);
      }

      setShowAddModal(true);
    }
  };

  // Drag and drop mock triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadName(file.name);
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
        setUploadCategory('Images');
      } else if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) {
        setUploadCategory('Videos');
      } else if (['mp3', 'wav', 'ogg', 'aac'].includes(ext || '')) {
        setUploadCategory('Audio');
      } else {
        setUploadCategory('Documents');
      }
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb >= 1) setUploadSize(`${sizeMb.toFixed(1)} MB`);
      else setUploadSize(`${(file.size / 1024).toFixed(0)} KB`);
      
      setShowAddModal(true);
    }
  };

  // Filter media library items
  const filteredMedia = mediaList.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || m.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div style={{ padding: '28px', background: '#faf9f9', minHeight: 'calc(100vh - 98px)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.4px', margin: 0 }}>
            Media Library Vault
          </h1>
          <p style={{ fontSize: 12.5, color: '#6b7280', marginTop: 3 }}>
            Manage images, docs, audio guidance, and promotional videos utilized in automated flows.
          </p>
        </div>

        <button 
          onClick={() => { triggerFileInput(); }}
          style={{
            padding: '10px 18px', fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(220,38,38,0.2)',
          }}
        >
          <Upload size={15} /> Upload Media Asset
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* ── DRAG AND DROP ZONE ── */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? '2px dashed #dc2626' : '2px dashed rgba(220,38,38,0.15)',
          background: isDragging ? '#fef2f2' : '#fff',
          borderRadius: 14, padding: '34px 20px', textAlign: 'center',
          marginBottom: 28, transition: 'all 0.15s ease',
          boxShadow: '0 2px 10px rgba(0,0,0,0.015)'
        }}
      >
        <div style={{ 
          width: 44, height: 44, borderRadius: 10, background: '#fef2f2', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' 
        }}>
          <Upload size={20} color="#dc2626" />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
          Drag & Drop files here or <span onClick={triggerFileInput} style={{ color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}>browse local files</span>
        </div>
        <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
          Supports PNG, JPG, PDF, MP4, MP3 up to 50MB. Files are automatically mapped to official Supabase storage buckets.
        </span>
      </div>

      {/* ── SEGMENT CONTROLS & SEARCH BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        
        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'All', label: 'All Assets', icon: Folder },
            { id: 'Images', label: 'Images', icon: ImageIcon },
            { id: 'Documents', label: 'Documents', icon: FileText },
            { id: 'Videos', label: 'Videos', icon: VideoIcon },
            { id: 'Audio', label: 'Audio Tracks', icon: Music },
          ].map(tab => {
            const act = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', fontSize: 12.5, fontWeight: 650, borderRadius: 8,
                  background: act ? '#fef2f2' : '#fff',
                  color: act ? '#dc2626' : '#4b5563',
                  border: act ? '1px solid rgba(220,38,38,0.18)' : '1px solid #e5e7eb',
                  cursor: 'pointer', transition: 'all 0.12s'
                }}
              >
                <tab.icon size={14} color={act ? '#dc2626' : '#9ca3af'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search vault..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px 7px 32px', fontSize: 12.5,
              border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', background: '#fff'
            }}
          />
        </div>
      </div>

      {/* ── CARD VISUAL GRID ── */}
      {filteredMedia.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {filteredMedia.map(file => {
            const isImage = file.category === 'Images';
            const isDoc = file.category === 'Documents';
            const isVideo = file.category === 'Videos';
            const isAudio = file.category === 'Audio';
            
            return (
              <div 
                key={file.id}
                style={{
                  background: '#fff', borderRadius: 12, border: '1px solid rgba(220,38,38,0.05)',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.01)', transition: 'transform 0.15s ease'
                }}
              >
                {/* Visual Thumbnail Frame */}
                <div style={{ 
                  height: 124, background: '#fdfcfc', 
                  borderBottom: '1px solid #f9f8f8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 34, position: 'relative'
                }}>
                  {isImage ? (
                    <div style={{ 
                      width: '100%', height: '100%', 
                      background: 'linear-gradient(135deg, #fee2e2, #fef2f2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#dc2626'
                    }}>
                      🖼️
                    </div>
                  ) : isDoc ? (
                    <span style={{ color: '#ef4444' }}>📄</span>
                  ) : isVideo ? (
                    <span style={{ color: '#3b82f6' }}>🎬</span>
                  ) : (
                    <span style={{ color: '#10b981' }}>🎵</span>
                  )}
                  
                  {/* Category Pill Tag */}
                  <span style={{
                    position: 'absolute', bottom: 8, left: 8,
                    fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                    background: '#111827', color: '#fff'
                  }}>
                    {file.category}
                  </span>
                </div>

                {/* File details context */}
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
                    {file.name}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', fontWeight: 550 }}>
                    <span>{file.size}</span>
                    <span>{file.addedAt}</span>
                  </div>

                  {/* Actions buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, borderTop: '1px solid #f9f8f8', paddingTop: 8 }}>
                    <button
                      onClick={() => handleCopyLink(file.url, file.id)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        padding: '6px', fontSize: 11.5, fontWeight: 650, borderRadius: 6,
                        background: '#fef2f2', border: '1px solid rgba(220,38,38,0.08)',
                        color: '#dc2626', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {copiedId === file.id ? (
                        <><Check size={12} /> Copied!</>
                      ) : (
                        <><Copy size={12} /> Copy URL</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteMedia(file.id)}
                      style={{
                        padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                        background: '#fff', border: '1px solid #fee2e2', color: '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', height: 280, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9ca3af', background: '#fff', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)' }}>
          <Folder size={40} />
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12 }}>No Assets Found</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>Try searching something else or upload a new asset.</div>
        </div>
      )}

      {/* ── CONFIRM NEW FILE DETAILS MODAL ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff', width: 440, borderRadius: 14,
            padding: '20px 24px', border: '1px solid rgba(220,38,38,0.1)',
            boxShadow: '0 15px 45px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={16} color="#dc2626" />
                Register Uploaded Asset
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={16} color="#6b7280" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>File Name</label>
                <input 
                  type="text" required
                  value={uploadName} onChange={e => setUploadName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Category</label>
                  <select 
                    value={uploadCategory} onChange={e => setUploadCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    <option>Images</option>
                    <option>Documents</option>
                    <option>Videos</option>
                    <option>Audio</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Identified Size</label>
                  <input 
                    type="text" required disabled
                    value={uploadSize}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.05)', borderRadius: 8, background: '#fafafa', color: '#9ca3af' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: 600, border: '1px solid #e5e7eb', background: '#fff', color: '#4b5563', borderRadius: 8, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    padding: '8px 20px', fontSize: 12.5, fontWeight: 700, 
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', 
                    border: 'none', borderRadius: 8, cursor: 'pointer', 
                    boxShadow: '0 3px 10px rgba(220,38,38,0.15)' 
                  }}
                >
                  Register Public Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
