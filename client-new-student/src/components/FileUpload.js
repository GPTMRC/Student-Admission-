import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const FileUpload = ({ 
  label, 
  fileType, 
  accept, 
  onFileUpload, 
  currentFile,
  error,
  required 
}) => {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);

      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check if user is authenticated, if not, use public upload method
      const { data: { user } } = await supabase.auth.getUser();
      
      const fileExt = file.name.split('.').pop();
      const fileName = user 
        ? `${user.id}/${fileType}_${Date.now()}.${fileExt}`
        : `public/${fileType}_${Date.now()}.${fileExt}`;
      
      const filePath = `admission-documents/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('admission-files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('admission-files')
        .getPublicUrl(filePath);

      onFileUpload(fileType, data.publicUrl);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Error uploading ${label}: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await handleFileUpload(file);
    }
    event.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const removeFile = () => {
    onFileUpload(fileType, '');
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return '📎';
    if (fileName.includes('.pdf')) return '📄';
    if (fileName.includes('.doc') || fileName.includes('.docx')) return '📝';
    if (fileName.includes('.jpg') || fileName.includes('.png') || fileName.includes('.jpeg') || fileName.includes('.gif')) return '🖼️';
    return '📎';
  };

  const getFileNameFromUrl = (url) => {
    if (!url) return 'Uploaded file';
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'Uploaded file';
    } catch {
      return 'Uploaded file';
    }
  };

  return (
    <div className="document-card">
      <div className="document-card-header">
        <div className="document-card-label">
          {label}
          {required && <span className="required">*</span>}
        </div>
        <div className={`document-status ${currentFile ? 'uploaded' : 'missing'}`}>
          {currentFile ? 'Uploaded' : 'Required'}
        </div>
      </div>

      {!currentFile ? (
        <div
          className={`file-upload-area ${isDragging ? 'dragover' : ''} ${error ? 'error' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`file-input-${fileType}`).click()}
        >
          <div className="upload-icon">
            {uploading ? '⏳' : '📤'}
          </div>
          <div className="upload-text">
            {uploading ? 'Uploading...' : (isDragging ? 'Drop file here' : `Click or drag to upload ${label}`)}
          </div>
          <div className="upload-hint">
            {accept.includes('image/*') ? 'Supports: JPG, PNG, GIF' : 'Supports: PDF, Word, Images'} • Max 5MB
          </div>
          <input
            id={`file-input-${fileType}`}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="uploaded-file">
          <div className="file-info">
            <span className="file-icon">{getFileIcon(currentFile)}</span>
            <span className="file-name" title={getFileNameFromUrl(currentFile)}>
              {getFileNameFromUrl(currentFile)}
            </span>
          </div>
          <div className="file-actions">
            <button 
              type="button" 
              className="btn-icon" 
              onClick={() => document.getElementById(`file-input-${fileType}`).click()}
              disabled={uploading}
              title="Replace file"
            >
              🔄
            </button>
            <a 
              href={currentFile} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-icon"
              title="View file"
            >
              👁️
            </a>
            <button 
              type="button" 
              className="btn-icon" 
              onClick={removeFile}
              disabled={uploading}
              title="Remove file"
            >
              🗑️
            </button>
          </div>
          <input
            id={`file-input-${fileType}`}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {error && !currentFile && (
        <div className="error-text">
          ⚠ {error}
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="progress-text">Uploading...</div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;