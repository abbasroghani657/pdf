import { useAuth } from '../contexts/AuthContext';
import React from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function ComparePage() {
  const { isPro } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mt-4">
      <div className="max-w-4xl mx-auto">
        {/* Comparison table */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="py-4 px-6 text-sm font-semibold text-gray-500 w-2/5">Feature</th>
                <th className="py-4 px-6 text-sm font-bold text-[#378ADD] w-[30%] border-l border-gray-100 bg-blue-50/30">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-[#378ADD] rounded flex items-center justify-center text-white font-bold text-[10px]">P</div>
                    PDFMaster
                  </div>
                </th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-400 w-[30%] border-l border-gray-100">ILovePDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { feature: 'Free file size limit', us: '100 MB', them: '15 MB', winner: true },
                { feature: 'AI-powered tools', us: '✓ Yes (5 tools)', them: '✗ No', winner: true, usClass: 'text-emerald-600', themClass: 'text-red-400' },
                { feature: 'Pro subscription price', us: '$4.99/mo', them: '$9.99/mo', winner: true },
                { feature: 'Total tools available', us: '37+', them: '25', winner: true },
                { feature: 'No signup required', us: '✓ Yes', them: '✗ No', winner: true, usClass: 'text-emerald-600', themClass: 'text-red-400' },
                { feature: 'Processing speed', us: '2× Faster (Edge CDN)', them: 'Standard', winner: true },
                { feature: 'API access on free plan', us: '✗ Pro only', them: '✗ Pro only', winner: false },
                { feature: 'Batch processing', us: '✓ Yes', them: '✓ Yes', winner: false, usClass: 'text-emerald-600', themClass: 'text-emerald-500' },
                { feature: 'File auto-delete', us: '2 hours', them: '2 hours', winner: false },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/40">
                  <td className="py-4 px-6 text-sm text-gray-700 font-medium">{row.feature}</td>
                  <td className={clsx('py-4 px-6 text-sm font-semibold border-l border-gray-100 bg-blue-50/20', row.usClass || 'text-gray-900')}>
                    {row.us}
                  </td>
                  <td className={clsx('py-4 px-6 text-sm border-l border-gray-100', row.themClass || 'text-gray-400')}>
                    {row.them}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why us cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            { icon: 'solar:stars-bold', color: 'bg-fuchsia-50 text-fuchsia-600', title: 'AI-powered tools — free', desc: 'Chat with PDFs, auto-summarize, and translate documents. Features ILovePDF simply doesn\'t have.' },
            { icon: 'solar:box-minimalistic-bold', color: 'bg-blue-50 text-blue-600', title: 'Bigger free tier', desc: `Process files up to ${isPro ? '2GB' : '10MB'} without paying. Stop hitting paywalls for everyday tasks.` },
            { icon: 'solar:wallet-bold', color: 'bg-amber-50 text-amber-600', title: 'Half the price', desc: 'Pro at $4.99/mo vs ILovePDF\'s $9.99. Same quality, half the cost.' },
            { icon: 'solar:layers-bold', color: 'bg-emerald-50 text-emerald-600', title: '12 more tools', desc: 'The most comprehensive PDF suite available. If you need a PDF tool, we have it.' },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center mb-4', card.color)}>
                <iconify-icon icon={card.icon} class="text-xl"></iconify-icon>
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-2">{card.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-[#1e3a5f] to-[#378ADD] rounded-3xl p-10 text-white">
          <h3 className="text-xl font-bold mb-2">Ready to switch?</h3>
          <p className="text-blue-100 text-sm mb-6">Join professionals who chose the smarter PDF toolkit.</p>
          <button
            onClick={() => { navigate('/'); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#378ADD] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg hover:-translate-y-0.5"
          >
            Try PDFMaster for free
            <iconify-icon icon="solar:arrow-right-linear" class="text-lg"></iconify-icon>
          </button>
        </div>
      </div>
    </div>
  );
}
