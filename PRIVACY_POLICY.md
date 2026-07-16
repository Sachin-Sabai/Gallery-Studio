# Privacy Policy for Gallery Studio

**Last Updated:** July 16, 2026

Gallery Studio ("we", "our", "us") is committed to protecting the privacy of our users. This Privacy Policy describes how we collect, use, and disclose personal information when you install and use the **Gallery Studio** Shopify application (the "App") in connection with your Shopify-supported store (the "Store").

---

## 1. Personal Information We Collect

When you install and use the App, we automatically collect and access certain information from your Shopify account. This information includes:

### A. Merchant Information
To provide the core features of the App and authenticate your session, we access and store:
* **Shop Details:** Shop URL (e.g., `your-store.myshopify.com`), shop name, and shop email address.
* **Account Owner Details:** First name, last name, email address, and locale.
* **Shopify Access Token:** Required to communicate with the Shopify API on your behalf.

### B. Gallery Content and Configuration
We store the data you create and upload to display galleries on your storefront:
* **Gallery Settings:** Titles, subtitles, layout preferences, and custom styling configurations.
* **Gallery Images:** Images uploaded to the App (stored on Shopify CDN or our hosting), alt text, and ordering sequence.

### C. Automatically Collected Information
When you interact with the App, we may collect technical data, including:
* Server log information (IP addresses, browser type, operating system, and access timestamps) for security, maintenance, and analytics.

---

## 2. How We Use Your Personal Information

We use the collected information for the following purposes:
* **Core Functionality:** To display galleries, sliders, and portfolios on your Shopify store as configured.
* **Session Management:** To keep you logged in to the App admin portal and authenticate requests.
* **Billing:** To manage subscription charges and billing using Shopify's Billing API.
* **Customer Support:** To diagnose technical issues, respond to your inquiries, and offer support.
* **Security & Performance:** To prevent fraud, secure our databases, and optimize App performance.

---

## 3. Access Scopes and Permissions

To function correctly, the App requests permissions to access the following Shopify API scopes:
* `write_products` / `read_products`: To link products to your gallery images.
* `write_metaobjects` / `write_metaobject_definitions`: To store and organize custom gallery definitions directly in your Shopify backend.
* `write_files` / `read_files`: To store and load gallery images and assets.

---

## 4. Data Sharing and Disclosure

We do not sell, rent, or trade your personal information to third parties. We share information only in the following scenarios:
* **Service Providers:** We may share your information with trusted third-party service providers (such as hosting, database, and cloud storage providers) who help us operate the App.
* **Compliance with Laws:** We may disclose your information to comply with applicable laws and regulations, respond to a subpoena, search warrant, or other lawful request for information.

---

## 5. Data Retention and Deletion

* **Retention:** We retain your data (galleries, settings, and session details) for as long as the App remains installed on your store.
* **Shopify Uninstallation Webhook:** When you uninstall the App, we receive an automatic webhook (`app/uninstalled`). Within **48 hours** of uninstalling the App, we will purge all your session data and gallery configurations from our database, except where required by law.

---

## 6. Shopify Mandatory Privacy Webhooks

The App is fully compliant with Shopify's Mandatory Webhooks requirements:
* **Customer Data Request (`customers/data_request`):** Since our App displays galleries and does not store individual buyer/customer profiles, we generally do not hold customer personal data. However, if Shopify requests customer details on your behalf, we will cooperate and provide any relevant information.
* **Customer Data Redaction (`customers/redact`):** If a customer requests redaction of their personal data, we will erase any records of that customer if any exist.
* **Shop Data Redaction (`shop/redact`):** When you uninstall the App, this webhook triggers a request to delete all store information from our database, which we perform within 48 hours.

---

## 7. Your Rights (GDPR & CCPA)

If you are a resident of the European Economic Area (EEA) or California, you have certain rights regarding your personal data:
* **Access & Portability:** You have the right to request access to the personal data we hold about you.
* **Correction:** You have the right to request corrections to any inaccurate data.
* **Erasure:** You have the right to request that we delete your personal data.

To exercise these rights, please contact us at **support@sabaiinnovations.com**.

---

## 8. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any significant changes by updating the "Last Updated" date at the top of this policy.

---

## 9. Contact Us

For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by email at **support@sabaiinnovations.com**.
