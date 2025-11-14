import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './AnimatedBackground.css';

const AnimatedBackground = ({ children, particleCount = 50 }) => {
  const particlesRef = useRef(null);

  useEffect(() => {
    createParticles();
  }, [particleCount]);

  const createParticles = () => {
    const particlesContainer = particlesRef.current;
    if (!particlesContainer) return;

    particlesContainer.innerHTML = '';

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      const size = Math.random() * 6 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.bottom = `-${size}px`;
      const duration = Math.random() * 15 + 10;
      particle.style.animationDuration = `${duration}s`;
      const delay = Math.random() * 5;
      particle.style.animationDelay = `${delay}s`;
      
      particlesContainer.appendChild(particle);
    }
  };

  return (
    <div className="animated-background-container">
      <div className="background">
        <div className="particles" ref={particlesRef}></div>
      </div>
      
      <div className="content">
        <div className="logo-space">
             <img src="/logo-ptc.png" alt="PTC LOGO" className="logo" />
        </div>

        <div className="welcome-content">
          <h1>University Admission System</h1>
          <p className="welcome-subtitle">
            Sign in with your school account to continue your journey
          </p>
          
          <div className="button-container">
            <Link to="/admission" className="action-btn primary-btn">
              Log in
            </Link>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground;