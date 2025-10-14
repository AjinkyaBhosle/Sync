'use client';

import Link from 'next/link';
import './homepage.css';

export default function HomePage() {
  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <div className="logo">SYNC AI</div>
        <nav className="main-nav">
          <Link href="/about">About</Link>
          <Link href="/community">Community</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <div className="auth-buttons">
          <Link href="/login" className="auth-button sign-in">Sign In</Link>
          <Link href="/signup" className="auth-button sign-up">Sign Up</Link>
        </div>
      </header>

      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Create Music with AI</h1>
          <p className="hero-subtitle">Bring your musical ideas to life. No experience needed.</p>
          <Link href="/generate" className="cta-button">Get Started</Link>
        </div>
        <div className="hero-images">
          <div className="image-grid">
            <div className="image-container vintage">
              <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Vintage microphone" />
            </div>
            <div className="image-container modern">
              <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Modern DJ setup" />
            </div>
            <div className="image-container a80s">
              <img src="https://images.unsplash.com/photo-1593692636579-a424391b3689?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="80s boombox" />
            </div>
            <div className="image-container a90s">
              <img src="https://images.unsplash.com/photo-1541876497-3191999D809d?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="90s cassette player" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}