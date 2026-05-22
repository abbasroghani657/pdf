import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function MobileBottomSheet({ title, children, onClose }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 md:hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </motion.div>
    </>
  );
}
