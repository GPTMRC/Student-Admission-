import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AdminSettings.css';

const AdminSettings = () => {
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@ptc.edu'
  });
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = () => {
    const savedProfile = localStorage.getItem('adminProfile');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
  };

  const saveProfileData = (data) => {
    localStorage.setItem('adminProfile', JSON.stringify(data));
    setProfileData(data);
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setChangePasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateProfile = async () => {
    setSettingsLoading(true);
    setSettingsMessage('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      saveProfileData(profileData);
      setSettingsMessage('Profile updated successfully!');
      setIsEditingProfile(false);
      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (error) {
      setSettingsMessage('Error updating profile: ' + error.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const changePassword = async () => {
    setSettingsLoading(true);
    setSettingsMessage('');
    
    try {
      if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      if (changePasswordData.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettingsMessage('Password changed successfully!');
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (error) {
      setSettingsMessage('Error changing password: ' + error.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    loadProfileData();
  };

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Manage your profile and security settings</p>
      </div>

      {settingsMessage && (
        <div className={`settings-message ${settingsMessage.includes('Error') ? 'error' : 'success'}`}>
          {settingsMessage}
        </div>
      )}

      <div className="settings-grid">
        {/* Profile Settings Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Profile Information</h3>
            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="btn btn-primary"
              >
                Edit Profile
              </button>
            ) : (
              <div className="profile-actions">
                <button
                  onClick={updateProfile}
                  disabled={settingsLoading}
                  className="btn btn-primary"
                >
                  {settingsLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  disabled={!isEditingProfile}
                  className={!isEditingProfile ? 'disabled' : ''}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  disabled={!isEditingProfile}
                  className={!isEditingProfile ? 'disabled' : ''}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Change Password</h3>
          </div>

          <div className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={changePasswordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={changePasswordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={changePasswordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <button
              onClick={changePassword}
              disabled={settingsLoading || !changePasswordData.newPassword || !changePasswordData.confirmPassword}
              className="btn btn-primary change-password-btn"
            >
              {settingsLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* System Information Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>System Information</h3>
          </div>
          
          <div className="system-info">
            <div className="info-item">
              <span className="info-label">Last Login:</span>
              <span className="info-value">{new Date().toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Type:</span>
              <span className="info-value">Administrator</span>
            </div>
            <div className="info-item">
              <span className="info-label">System Version:</span>
              <span className="info-value">v2.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;