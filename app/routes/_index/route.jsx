import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className="login-root-container">
      {/* Import Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-dark: #070a13;
          --bg-card: rgba(15, 23, 42, 0.65);
          --border-glass: rgba(255, 255, 255, 0.08);
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --accent-purple: #c084fc;
          --accent-blue: #60a5fa;
          --accent-glow: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%);
        }

        body, .login-root-container {
          margin: 0;
          padding: 0;
          background-color: var(--bg-dark);
          font-family: 'Outfit', sans-serif;
          color: var(--text-primary);
          overflow-x: hidden;
        }

        .login-page-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 24px;
          box-sizing: border-box;
        }

        /* Glowing Decorative Blobs */
        .glow-blob {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.22;
          z-index: 0;
          pointer-events: none;
        }

        .glow-purple {
          top: -120px;
          right: -120px;
          background: #a855f7;
        }

        .glow-blue {
          bottom: -120px;
          left: -120px;
          background: #3b82f6;
        }

        /* Container Layout */
        .main-container {
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 60px;
          align-items: center;
          z-index: 1;
          position: relative;
        }

        @media (max-width: 900px) {
          .main-container {
            grid-template-columns: 1fr;
            gap: 40px;
            max-width: 550px;
          }
          .brand-visual-section {
            display: none;
          }
        }

        /* Brand Column Details */
        .brand-info-section {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .logo-tag {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          background: var(--accent-glow);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-title {
          font-size: 52px;
          font-weight: 800;
          line-height: 1.15;
          margin: 0;
          background: linear-gradient(to right, #ffffff, #cbd5e1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -1px;
        }

        .brand-subtitle {
          font-size: 18px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
          font-weight: 300;
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 10px 0;
          padding: 0;
          list-style: none;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          font-size: 15px;
          color: #cbd5e1;
        }

        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-glass);
          border-radius: 8px;
          font-size: 13px;
          color: var(--accent-purple);
        }

        /* Visual CSS Gallery Mock */
        .brand-visual-section {
          margin-top: 20px;
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid var(--border-glass);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 30px rgba(255,255,255,0.01);
        }

        .visual-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .visual-dot-group {
          display: flex;
          gap: 6px;
        }

        .visual-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
        }

        .mock-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .mock-img-card {
          height: 120px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%);
          border: 1px solid rgba(255, 255, 255, 0.04);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mock-img-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
        }

        .mock-img-card:hover {
          transform: translateY(-5px) scale(1.03);
          border-color: rgba(255, 255, 255, 0.16);
          box-shadow: 0 10px 20px -10px rgba(168, 85, 247, 0.3);
        }

        .mock-card-1 { 
          background-image: radial-gradient(circle at 30% 30%, #3b82f6 0%, transparent 60%); 
        }
        .mock-card-2 { 
          background-image: radial-gradient(circle at 70% 30%, #a855f7 0%, transparent 60%); 
        }
        .mock-card-3 { 
          background-image: radial-gradient(circle at 50% 50%, #10b981 0%, transparent 60%); 
        }

        /* Login Card Container */
        .login-card {
          background: var(--bg-card);
          border: 1px solid var(--border-glass);
          border-radius: 28px;
          padding: 44px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .card-title {
          font-size: 30px;
          font-weight: 700;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
          color: #ffffff;
        }

        .card-description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 32px 0;
        }

        /* Form styling */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #e2e8f0;
        }

        .shop-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 15px;
          font-family: inherit;
          color: #ffffff;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .shop-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--accent-purple);
          box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.15);
        }

        .help-text {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .submit-btn {
          width: 100%;
          background: var(--accent-glow);
          border: none;
          border-radius: 12px;
          padding: 16px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 14px rgba(168, 85, 247, 0.25);
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.45);
          opacity: 0.95;
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .footer-text {
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          margin-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 20px;
        }
      `}} />

      <div className="login-page-wrapper">
        {/* Glow Blobs */}
        <div className="glow-blob glow-purple"></div>
        <div className="glow-blob glow-blue"></div>

        <div className="main-container">
          {/* Left Column: Brand Info */}
          <div className="brand-info-section">
            <span className="logo-tag">⚡ Gallery Studio</span>
            <h1 className="brand-title">Stunning Shoppable Lookbooks & Image Galleries</h1>
            <p className="brand-subtitle">
              Design premium visual galleries, product tagging hotspots, masonry grids, and slideshow sliders directly integrated inside your storefront.
            </p>

            <ul className="features-list">
              <li className="feature-item">
                <span className="feature-icon">🎨</span>
                <span><strong>10+ Premium Themes:</strong> Grid, Masonry, Lookbooks, Slider & more.</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">⚡</span>
                <span><strong>Speed Optimized:</strong> 100% native rendering ensures blazing fast storefront load times.</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">🏷️</span>
                <span><strong>Shoppable Hotspots:</strong> Tag products directly on images to drive instant checkout conversions.</span>
              </li>
            </ul>

            {/* Simulated Live Gallery Visual */}
            <div className="brand-visual-section">
              <div className="visual-header">
                <div className="visual-dot-group">
                  <div className="visual-dot"></div>
                  <div className="visual-dot"></div>
                  <div className="visual-dot"></div>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", textTransform: "uppercase" }}>Layout Previews</span>
              </div>
              <div className="mock-gallery">
                <div className="mock-img-card mock-card-1"></div>
                <div className="mock-img-card mock-card-2"></div>
                <div className="mock-img-card mock-card-3"></div>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="login-card">
            <h2 className="card-title">Log in</h2>
            <p className="card-description">Enter your Shopify store domain to access your app dashboard.</p>

            {showForm && (
              <Form className="login-form" method="post" action="/auth/login">
                <div className="form-group">
                  <label className="form-label" htmlFor="shop">Shop Domain</label>
                  <input
                    id="shop"
                    className="shop-input"
                    type="text"
                    name="shop"
                    placeholder="my-shop-domain.myshopify.com"
                    required
                  />
                  <span className="help-text">e.g: my-shop-domain.myshopify.com</span>
                </div>
                <button className="submit-btn" type="submit">
                  Log in
                </button>
              </Form>
            )}

            <div className="footer-text">
              Securely authenticated via Shopify OAuth.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

