import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData || { errors: {} };

  return (
    <AppProvider embedded={false}>
      {/* Import Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-dark: #090d16;
          --bg-card: rgba(17, 24, 39, 0.7);
          --border-glass: rgba(255, 255, 255, 0.08);
          --text-primary: #f3f4f6;
          --text-secondary: #9ca3af;
          --accent-purple: #a855f7;
          --accent-blue: #3b82f6;
          --accent-glow: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%);
        }

        body {
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
          padding: 20px;
          box-sizing: border-box;
        }

        /* Glowing Blobs for Premium Background Effect */
        .glow-blob {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.25;
          z-index: 0;
          pointer-events: none;
        }

        .glow-purple {
          top: -100px;
          right: -100px;
          background: var(--accent-purple);
        }

        .glow-blue {
          bottom: -100px;
          left: -100px;
          background: var(--accent-blue);
        }

        /* Container Layout */
        .main-container {
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 50px;
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
          gap: 24px;
        }

        .logo-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          background: var(--accent-glow);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.15;
          margin: 0;
          background: linear-gradient(to right, #ffffff, #d1d5db);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
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
          gap: 12px;
          font-size: 15px;
          color: #d1d5db;
        }

        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          border-radius: 6px;
          font-size: 12px;
          color: var(--accent-purple);
        }

        /* Mini Interactive CSS Gallery Preview */
        .brand-visual-section {
          margin-top: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 20px rgba(255,255,255,0.02);
        }

        .visual-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .visual-dot-group {
          display: flex;
          gap: 6px;
        }

        .visual-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }

        .mock-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .mock-img-card {
          height: 110px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .mock-img-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
        }

        .mock-img-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .mock-card-1 { background-image: radial-gradient(circle at 30% 30%, #3b82f6 0%, transparent 60%); }
        .mock-card-2 { background-image: radial-gradient(circle at 70% 30%, #a855f7 0%, transparent 60%); }
        .mock-card-3 { background-image: radial-gradient(circle at 50% 50%, #10b981 0%, transparent 60%); }

        /* Login Card Container */
        .login-card {
          background: var(--bg-card);
          border: 1px solid var(--border-glass);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .card-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 10px 0;
          letter-spacing: -0.5px;
        }

        .card-description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 30px 0;
        }

        /* Form Controls */
        .form-group {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #d1d5db;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
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

        .shop-input-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15) !important;
        }

        .help-text {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        /* Error Message Banner */
        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #f87171;
          font-size: 14px;
        }

        /* Submit Button */
        .submit-btn {
          width: 100%;
          background: var(--accent-glow);
          border: none;
          border-radius: 12px;
          padding: 15px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
          opacity: 0.95;
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .footer-text {
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin-top: 30px;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 16px;
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
            <h1 className="brand-title">Create Beautiful Visual Galleries for Your Store</h1>
            <p className="brand-subtitle">
              Design premium shoppable lookbooks, responsive sliders, masonry grids, and product showcase carousels directly inside Shopify Online Store 2.0.
            </p>

            <ul className="features-list">
              <li className="feature-item">
                <span className="feature-icon">✨</span>
                <span><strong>10+ Premium Themes:</strong> Grid, Masonry, Lookbooks, Slider and more.</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">⚡</span>
                <span><strong>Blazing Fast Speed:</strong> Natively compiled for high storefront loading speeds.</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">🛍️</span>
                <span><strong>Shoppable Tags:</strong> Embed tags on images to direct users straight to product checkout.</span>
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
            <h2 className="card-title">Log in to App</h2>
            <p className="card-description">Enter your Shopify store domain to access your app configurations.</p>

            <Form method="post">
              {errors?.shop && (
                <div className="error-banner">
                  <span style={{ fontSize: "16px" }}>⚠️</span>
                  <span>{errors.shop}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="shop">Shop Domain</label>
                <div className="input-container">
                  <input
                    id="shop"
                    name="shop"
                    type="text"
                    placeholder="my-store.myshopify.com"
                    className={`shop-input ${errors?.shop ? "shop-input-error" : ""}`}
                    value={shop}
                    onChange={(e) => setShop(e.currentTarget.value)}
                    autoComplete="on"
                  />
                </div>
                <span className="help-text">e.g., store-name.myshopify.com</span>
              </div>

              <button className="submit-btn" type="submit">
                Access Dashboard
              </button>
            </Form>

            <div className="footer-text">
              Securely verified with Shopify Partner OAuth.
            </div>
          </div>
        </div>
      </div>
    </AppProvider>
  );
}
