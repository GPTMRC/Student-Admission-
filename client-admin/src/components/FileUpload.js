import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const FileUpload = ({ 
  label, 
  fileType, 
  accept, 
  onFileUpload, 
  currentFile,
  required 
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);

      const file = event.target.files[0];
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
      event.target.value = '';
    }
  };

  const removeFile = () => {
    onFileUpload(fileType, '');
  };

  return (
    <div className="file-upload-group">
      <label className="file-upload-label">
        {label} {required && <span className="required">*</span>}
      </label>
      
      <div className="file-upload-container">
        {!currentFile ? (
          <div className="file-upload-area">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              accept={accept}
              className="file-input"
            />
            <div className="upload-placeholder">
              {uploading ? 'Uploading...' : `Click to upload ${label}`}
            </div>
          </div>
        ) : (
          <div className="file-preview">
            <span className="file-name">✅ File uploaded successfully</span>
            <button 
              type="button" 
              onClick={removeFile}
              className="remove-file-btn"
            >
              Remove
            </button>
            <a 
              href={currentFile} 
              target="_blank" 
              rel="noopener noreferrer"
              className="view-file-btn"
            >
              View
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
