import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="privacy-root-container">
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

        body, .privacy-root-container {
          margin: 0;
          padding: 0;
          background-color: var(--bg-dark);
          font-family: 'Outfit', sans-serif;
          color: var(--text-primary);
          overflow-x: hidden;
          min-height: 100vh;
        }

        .privacy-page-wrapper {
          max-width: 900px;
          margin: 0 auto;
          padding: 80px 24px;
          position: relative;
          z-index: 1;
        }

        /* Glowing Background Blobs */
        .glow-blob {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(160px);
          opacity: 0.15;
          z-index: 0;
          pointer-events: none;
        }

        .glow-top-left {
          top: -200px;
          left: -200px;
          background: #3b82f6;
        }

        .glow-bottom-right {
          bottom: -200px;
          right: -200px;
          background: #a855f7;
        }

        .header-section {
          text-align: center;
          margin-bottom: 60px;
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
          margin-bottom: 16px;
        }

        .page-title {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 16px 0;
          background: linear-gradient(to right, #ffffff, #cbd5e1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .last-updated {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 400;
        }

        .content-card {
          background: var(--bg-card);
          border: 1px solid var(--border-glass);
          border-radius: 24px;
          padding: 48px;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 600px) {
          .privacy-page-wrapper {
            padding: 40px 16px;
          }
          .content-card {
            padding: 24px;
          }
          .page-title {
            font-size: 32px;
          }
        }

        h2 {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 40px;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 8px;
        }

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--accent-purple);
          margin-top: 24px;
          margin-bottom: 12px;
        }

        p {
          font-size: 16px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-top: 0;
          margin-bottom: 16px;
        }

        ul {
          margin-top: 0;
          margin-bottom: 20px;
          padding-left: 24px;
        }

        li {
          font-size: 16px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        strong {
          color: #ffffff;
        }

        hr {
          border: 0;
          height: 1px;
          background: var(--border-glass);
          margin: 40px 0;
        }

        .footer-text {
          text-align: center;
          margin-top: 40px;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .footer-text a {
          color: var(--accent-blue);
          text-decoration: none;
        }

        .footer-text a:hover {
          text-decoration: underline;
        }
      `}} />

      <div className="glow-blob glow-top-left"></div>
      <div className="glow-blob glow-bottom-right"></div>

      <div className="privacy-page-wrapper">
        <header className="header-section">
          <div className="logo-tag">Gallery Studio</div>
          <h1 className="page-title">Privacy Policy</h1>
          <div className="last-updated">Last Updated: July 16, 2026</div>
        </header>

        <main className="content-card">
          <p>
            Gallery Studio (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting the privacy of our users. This Privacy Policy describes how we collect, use, and disclose personal information when you install and use the <strong>Gallery Studio</strong> Shopify application (the &quot;App&quot;) in connection with your Shopify-supported store (the &quot;Store&quot;).
          </p>

          <hr />

          <h2>1. Personal Information We Collect</h2>
          <p>
            When you install and use the App, we automatically collect and access certain information from your Shopify account. This information includes:
          </p>

          <h3>A. Merchant Information</h3>
          <p>To provide the core features of the App and authenticate your session, we access and store:</p>
          <ul>
            <li><strong>Shop Details:</strong> Shop URL (e.g., <code>your-store.myshopify.com</code>), shop name, and shop email address.</li>
            <li><strong>Account Owner Details:</strong> First name, last name, email address, and locale.</li>
            <li><strong>Shopify Access Token:</strong> Required to communicate with the Shopify API on your behalf.</li>
          </ul>

          <h3>B. Gallery Content and Configuration</h3>
          <p>We store the data you create and upload to display galleries on your storefront:</p>
          <ul>
            <li><strong>Gallery Settings:</strong> Titles, subtitles, layout preferences, and custom styling configurations.</li>
            <li><strong>Gallery Images:</strong> Images uploaded to the App (stored on Shopify CDN or our hosting), alt text, and ordering sequence.</li>
          </ul>

          <h3>C. Automatically Collected Information</h3>
          <p>When you interact with the App, we may collect technical data, including:</p>
          <ul>
            <li>Server log information (IP addresses, browser type, operating system, and access timestamps) for security, maintenance, and analytics.</li>
          </ul>

          <h2>2. How We Use Your Personal Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li><strong>Core Functionality:</strong> To display galleries, sliders, and portfolios on your Shopify store as configured.</li>
            <li><strong>Session Management:</strong> To keep you logged in to the App admin portal and authenticate requests.</li>
            <li><strong>Billing:</strong> To manage subscription charges and billing using Shopify's Billing API.</li>
            <li><strong>Customer Support:</strong> To diagnose technical issues, respond to your inquiries, and offer support.</li>
            <li><strong>Security &amp; Performance:</strong> To prevent fraud, secure our databases, and optimize App performance.</li>
          </ul>

          <h2>3. Access Scopes and Permissions</h2>
          <p>To function correctly, the App requests permissions to access the following Shopify API scopes:</p>
          <ul>
            <li><code>write_products</code> / <code>read_products</code>: To link products to your gallery images.</li>
            <li><code>write_metaobjects</code> / <code>write_metaobject_definitions</code>: To store and organize custom gallery definitions directly in your Shopify backend.</li>
            <li><code>write_files</code> / <code>read_files</code>: To store and load gallery images and assets.</li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell, rent, or trade your personal information to third parties. We share information only in the following scenarios:</p>
          <ul>
            <li><strong>Service Providers:</strong> We may share your information with trusted third-party service providers (such as hosting, database, and cloud storage providers) who help us operate the App.</li>
            <li><strong>Compliance with Laws:</strong> We may disclose your information to comply with applicable laws and regulations, respond to a subpoena, search warrant, or other lawful request for information.</li>
          </ul>

          <h2>5. Data Retention and Deletion</h2>
          <ul>
            <li><strong>Retention:</strong> We retain your data (galleries, settings, and session details) for as long as the App remains installed on your store.</li>
            <li><strong>Shopify Uninstallation Webhook:</strong> When you uninstall the App, we receive an automatic webhook (<code>app/uninstalled</code>). Within <strong>48 hours</strong> of uninstalling the App, we will purge all your session data and gallery configurations from our database, except where required by law.</li>
          </ul>

          <h2>6. Shopify Mandatory Privacy Webhooks</h2>
          <p>The App is fully compliant with Shopify's Mandatory Webhooks requirements:</p>
          <ul>
            <li><strong>Customer Data Request (<code>customers/data_request</code>):</strong> Since our App displays galleries and does not store individual buyer/customer profiles, we generally do not hold customer personal data. However, if Shopify requests customer details on your behalf, we will cooperate and provide any relevant information.</li>
            <li><strong>Customer Data Redaction (<code>customers/redact</code>):</strong> If a customer requests redaction of their personal data, we will erase any records of that customer if any exist.</li>
            <li><strong>Shop Data Redaction (<code>shop/redact</code>):</strong> When you uninstall the App, this webhook triggers a request to delete all store information from our database, which we perform within 48 hours.</li>
          </ul>

          <h2>7. Your Rights (GDPR &amp; CCPA)</h2>
          <p>If you are a resident of the European Economic Area (EEA) or California, you have certain rights regarding your personal data:</p>
          <ul>
            <li><strong>Access &amp; Portability:</strong> You have the right to request access to the personal data we hold about you.</li>
            <li><strong>Correction:</strong> You have the right to request corrections to any inaccurate data.</li>
            <li><strong>Erasure:</strong> You have the right to request that we delete your personal data.</li>
          </ul>
          <p>To exercise these rights, please contact us at <strong>support@sabaiinnovations.com</strong>.</p>

          <h2>8. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any significant changes by updating the &quot;Last Updated&quot; date at the top of this policy.</p>

          <h2>9. Contact Us</h2>
          <p>For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by email at <strong>support@sabaiinnovations.com</strong>.</p>
        </main>

        <p className="footer-text">
          &copy; {new Date().getFullYear()} Gallery Studio. All rights reserved.
        </p>
      </div>
    </div>
  );
}
