import React from 'react';
import SEOHead from '../components/SEOHead';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
      <SEOHead 
        title="Contact PDFMaster" 
        description="Get in touch with the PDFMaster team for support, business inquiries, or API access." 
        url="/contact"
      />
      
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Need help or have a business inquiry? We'd love to hear from you.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Form Side */}
          <div className="p-8 md:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea rows="4" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-all" required></textarea>
              </div>
              <button type="submit" className="w-full bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-xl py-3 font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
                Send Message
              </button>
            </form>
          </div>

          {/* Info Side */}
          <div className="bg-gray-50 p-8 md:p-10 border-t md:border-t-0 md:border-l border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#378ADD] flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:letter-bold" class="text-xl"></iconify-icon>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email Support</h3>
                  <p className="text-sm text-gray-500 mt-1">support@theylovepdf.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#378ADD] flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:case-round-bold" class="text-xl"></iconify-icon>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Business & API</h3>
                  <p className="text-sm text-gray-500 mt-1">business@theylovepdf.com</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
