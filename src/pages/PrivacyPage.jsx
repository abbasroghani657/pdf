import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

export default function PrivacyPage({ lang = 'en' }) {
  const { isPro } = useAuth();
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 animate-fade-in font-sans">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-gray-500 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-indigo prose-lg max-w-none text-gray-600">
        <p>
          At TheyLovePDF, we take your privacy seriously. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you visit our website and use our PDF tools. 
          Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
          please do not access the site.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
        <p>
          We may collect information about you in a variety of ways. The information we may collect on the Site includes:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number that you voluntarily give to us.</li>
          <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
          <li><strong>File Data:</strong> Documents you upload for processing. <strong>Please note:</strong> Files are end-to-end encrypted during transfer and are permanently deleted from our servers within 2 hours of processing. We do not inspect, copy, or retain your document contents.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use of Your Information</h2>
        <p>
          Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Create and manage your account.</li>
          <li>Process transactions and send related information, including purchase confirmations and invoices.</li>
          <li>Deliver the PDF processing services you request.</li>
          <li>Improve our website functionality and user experience.</li>
          <li>Respond to customer service requests.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Security of Your Information</h2>
        <p>
          We use administrative, technical, and physical security measures to help protect your personal information. 
          While we have taken reasonable steps to secure the personal information you provide to us, please be aware 
          that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission 
          can be guaranteed against any interception or other type of misuse.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. GDPR and CCPA Compliance</h2>
        <p>
          If you are a resident of the European Economic Area (EEA) or California, you have certain data protection rights. 
          TheyLovePDF aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.
          If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, 
          please contact us.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Contact Us</h2>
        <p>
          If you have questions or comments about this Privacy Policy, please contact us at:
        </p>
        <p className="mt-2 font-medium text-indigo-600">
          support@theylovepdf.com
        </p>
      </div>
    </div>
  );
}
