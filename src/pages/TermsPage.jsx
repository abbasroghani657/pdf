import { useAuth } from '../contexts/AuthContext';
import React from 'react';

export default function TermsPage() {
  const { isPro } = useAuth();
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 animate-fade-in font-sans">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-gray-500 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-indigo prose-lg max-w-none text-gray-600">
        <p>
          Welcome to PDFMaster. These Terms of Service ("Terms") govern your use of the PDFMaster website 
          and the services we offer. By accessing or using our services, you agree to be bound by these Terms.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing and using our website, you accept and agree to be bound by the terms and provision of this agreement. 
          In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable 
          to such services.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
        <p>
          PDFMaster provides users with access to a rich collection of resources, including various PDF manipulation tools 
          such as conversion, compression, merging, splitting, and signing (the "Service"). You understand and agree that the 
          Service is provided "AS-IS" and that PDFMaster assumes no responsibility for the timeliness, deletion, mis-delivery, 
          or failure to store any user communications or personalization settings.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Conduct and Responsibilities</h2>
        <p>
          You agree to not use the Service to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Upload, post, email, transmit or otherwise make available any Content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically or otherwise objectionable.</li>
          <li>Upload any files that contain viruses, Trojan horses, worms, time bombs, cancelbots, corrupted files, or any other similar software or programs that may damage the operation of another's computer or property of another.</li>
          <li>Forge headers or otherwise manipulate identifiers in order to disguise the origin of any Content transmitted through the Service.</li>
          <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Document Security & Data Retention</h2>
        <p>
          We employ end-to-end encryption to ensure the security of your files during transit. 
          All processed files are automatically and permanently deleted from our servers within a maximum of 2 hours 
          after the processing is complete. We do not claim any ownership rights over the files you upload.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Modifications to Service</h2>
        <p>
          PDFMaster reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, 
          the Service (or any part thereof) with or without notice. You agree that PDFMaster shall not be liable to you or to 
          any third party for any modification, suspension or discontinuance of the Service.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
        <p>
          You expressly understand and agree that PDFMaster shall not be liable for any direct, indirect, incidental, special, 
          consequential or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data 
          or other intangible losses resulting from the use or the inability to use the service.
        </p>
      </div>
    </div>
  );
}
