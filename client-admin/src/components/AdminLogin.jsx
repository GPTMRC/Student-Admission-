// src/components/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Minimal particle animation
  useEffect(() => {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 10;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const colors = [
      'rgba(255, 255, 255, 0.4)',
      'rgba(248, 250, 252, 0.3)',
    ];

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 10 + 5;
        this.speed = Math.random() * 0.8 + 0.3;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y += this.speed;
        if (this.y > canvas.height + 10) {
          this.reset();
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

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

      const { data: adminRow, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', loginData.email)
        .eq('password', loginData.password)
        .single();

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          throw new Error('Invalid email or password');
        }
        throw adminError;
      }

      if (!adminRow) {
        throw new Error('Invalid email or password');
      }

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

      onLoginSuccess && onLoginSuccess({ user, admin });

    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultAdmin = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: testData, error: testError } = await supabase
        .from('admin_users')
        .select('email')
        .limit(1);

      if (testError && testError.code === '42703') {
        setError(
          'Table structure is incorrect. Please run the SQL in Supabase SQL Editor to recreate the table with correct structure.'
        );
        return;
      }

      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', 'admin@ptc.edu.ph')
        .single();

      if (existingAdmin) {
        setError('Admin user already exists. Use: admin@ptc.edu.ph / demo123');
        setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });
        return;
      }

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

      setError('Default admin created successfully. Use: admin@ptc.edu.ph / demo123');
      setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });

    } catch (error) {
      setError('Failed to create admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });
    setError('');
  };

  return (
    <div className="login-container">
      <canvas 
        id="particleCanvas" 
        className="particle-canvas"
      />
      
      <div className="login-content-wrapper">
        {/* Left Side - Login Card */}
        <div className="login-center-wrapper">
          <div className="login-card">
            <div className="login-header">
              <h1 className="login-title">Welcome!</h1>
              <p className="login-subtitle">Please Enter your admin account to acces the dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="login-form" noValidate>
              {error && (
                <div className={`error-message ${error.includes('already exists') || error.includes('successfully') ? 'success-message' : ''}`} role="alert">
                  {error}
                </div>
              )}

              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>

              <div className="button-group">
                <button 
                  type="button" 
                  onClick={handleDemoLogin} 
                  disabled={loading}
                  className="demo-button"
                >
                  Use Demo Credentials
                </button>

                <button 
                  type="button" 
                  onClick={createDefaultAdmin} 
                  disabled={loading}
                  className="create-admin-button"
                >
                  Create Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Text Container */}
        <div className="text-container">
          <div className="text-content">
            <h1>PTC Admin Portal</h1>
            <h2>Manage Your Institution with Ease</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
