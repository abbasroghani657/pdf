import React from 'react';
import SEOHead from '../components/SEOHead';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
      <SEOHead 
        title="About PDFMaster" 
        description="Learn about the team behind PDFMaster, building the world's best free PDF tools." 
        url="/about"
      />
      
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">About PDFMaster</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          We believe document management should be fast, secure, and accessible to everyone.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-10">
        <div className="prose prose-blue max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            PDFMaster was built by a passionate global team of developers and document experts. Our mission is simple: 
            provide enterprise-grade PDF tools to the world, for free. Whether you are a student merging assignments, 
            a professional redacting sensitive contracts, or a developer extracting OCR data, PDFMaster is designed 
            to save you time and frustration.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy First</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            We understand that your documents contain sensitive information. That's why we engineered PDFMaster 
            with a privacy-first architecture. We use robust 256-bit SSL encryption, and your files are automatically 
            deleted from our cloud servers within 2 hours of processing. We do not inspect, copy, or share your data.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Entity</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            PDFMaster operates globally, providing high-availability digital services to millions of users. We are continuously 
            expanding our AI and core PDF capabilities to remain at the forefront of document technology.
          </p>
        </div>
      </div>
    </div>
  );
}
