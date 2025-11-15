// src/components/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // White duck egg particle animation
  useEffect(() => {
    const canvas = document.getElementById('duckEggCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 15;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // White color variations for eggs
    const whiteColors = [
      '#FFFFFF', // Pure white
      '#F8F8F8', // Slightly off-white
      '#F0F0F0', // Light gray-white
      '#F5F5F5', // White smoke
      '#FAFAFA', // Snow white
    ];

    // Particle class
    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * 20 + 10;
        this.speed = Math.random() * 2 + 1;
        this.color = whiteColors[Math.floor(Math.random() * whiteColors.length)];
        this.wobble = Math.random() * 2;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
        this.angle = Math.random() * Math.PI * 2;
      }

      update() {
        this.y += this.speed;
        this.angle += this.wobbleSpeed;
        this.x += Math.sin(this.angle) * this.wobble;

        // Reset particle if it goes off screen
        if (this.y > canvas.height + 20) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw white duck egg shape (oval with slight tilt)
        ctx.rotate(this.angle * 0.3);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.6, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.2, -this.size * 0.2, this.size * 0.2, this.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle shadow for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.beginPath();
        ctx.ellipse(this.size * 0.1, this.size * 0.2, this.size * 0.2, this.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(248, 250, 252, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('🔍 Attempting login with:', loginData.email);

      const { data: adminRow, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', loginData.email)
        .eq('password', loginData.password)
        .single();

      console.log('🔍 Login response:', { adminRow, adminError });

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          throw new Error('Invalid email or password');
        }
        throw adminError;
      }

      if (!adminRow) {
        throw new Error('Invalid email or password');
      }

      // SUCCESS - Create user object for AdminDashboard
      const user = {
        id: adminRow.id,
        email: adminRow.email,
        user_metadata: {
          full_name: adminRow.full_name
        }
      };

      const admin = {
        id: adminRow.id,
        full_name: adminRow.full_name,
        role: adminRow.role,
        email: adminRow.email
      };

      console.log('✅ Login successful!');
      onLoginSuccess && onLoginSuccess({ user, admin });

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultAdmin = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Creating default admin...');

      // First check if table exists and has correct structure
      const { data: testData, error: testError } = await supabase
        .from('admin_users')
        .select('email')
        .limit(1);

      console.log('🔍 Table check:', { testData, testError });

      if (testError && testError.code === '42703') {
        // Column doesn't exist - need to recreate table
        setError(`
          ❗ Table structure is incorrect. 
          Please run this SQL in Supabase SQL Editor:

          DROP TABLE IF EXISTS admin_users;

          CREATE TABLE admin_users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          INSERT INTO admin_users (email, password, full_name, role) 
          VALUES ('admin@ptc.edu.ph', 'demo123', 'PTC Administrator', 'super_admin');
        `);
        return;
      }

      // Check if admin already exists
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', 'admin@ptc.edu.ph')
        .single();

      if (existingAdmin) {
        setError('✅ Admin user already exists. Use: admin@ptc.edu.ph / demo123');
        setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });
        return;
      }

      // Create new admin
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert([
          {
            email: 'admin@ptc.edu.ph',
            password: 'demo123',
            full_name: 'PTC Administrator',
            role: 'super_admin'
          }
        ]);

      if (insertError) throw insertError;

      setError('✅ Default admin created! Use: admin@ptc.edu.ph / demo123');
      setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });

    } catch (error) {
      console.error('Create admin error:', error);
      setError('Failed to create admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });
    setError('');
  };

  const checkTableStructure = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .limit(1);

      if (error) {
        setError('Table error: ' + error.message);
      } else {
        setError('✅ Table structure is OK. Columns: ' + (data[0] ? Object.keys(data[0]).join(', ') : 'No data'));
      }
    } catch (err) {
      setError('Check failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Canvas */}
      <canvas 
        id="duckEggCanvas" 
        className="duck-egg-canvas"
      />
      
      {/* Logo Section - Beside the login card */}
      <div className="logo-section">
        <div className="logo-container-large">
          <img src="/logo-ptc.png" alt="PTC Logo" className="logo-image-large" />
        </div>
        <div className="college-info-large">
          <h1 className="college-name-large">Pateros Technological College</h1>
          <p className="institution-tagline">Excellence in Technological Education</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        <div className="login-header">
          <p className="login-title">Admin Portal</p>
          <p className="login-subtitle">Secure Access</p>
        </div>

        <form onSubmit={handleLogin} className="login-form" noValidate>
          {error && (
            <div className="error-message" role="alert" style={{ 
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              fontSize: error.includes('❗') ? '12px' : '14px'
            }}>
              {error.includes('✅') ? '✅' : '⚠️'} {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={loginData.email}
              onChange={handleInputChange}
              placeholder="admin@ptc.edu.ph"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={loginData.password}
              onChange={handleInputChange}
              placeholder="demo123"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing In...' : '🔐 Sign In to Dashboard'}
          </button>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={handleDemoLogin} 
              disabled={loading}
              style={{ flex: 1 }}
            >
              🚀 Fill Credentials
            </button>

            <button 
              type="button" 
              onClick={createDefaultAdmin} 
              disabled={loading}
              style={{ flex: 1, background: '#28a745' }}
            >
              ⚡ Create Admin
            </button>
          </div>

          <button 
            type="button" 
            onClick={checkTableStructure}
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '5px', 
              background: '#6c757d',
              fontSize: '12px',
              padding: '8px'
            }}
          >
            🔧 Check Table Structure
          </button>
        </form>

        <div className="login-footer">
          <p>Restricted Access - Authorized Personnel Only</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            First time? Run the SQL above, then click "Create Admin"
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;