// src/components/emergency/SOSButton.jsx
import React, { useState } from 'react'
import { AlertTriangle, MapPin, Send, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SOSModal from './SOSModal'

export default function SOSButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className="relative group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 
                   hover:from-red-500 hover:to-red-600 rounded-xl text-white font-semibold shadow-lg 
                   transition-all duration-300 overflow-hidden"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Glowing effect */}
        <div className="absolute inset-0 bg-red-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
        
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-xl ring-2 ring-red-400 animate-ping opacity-30" />
        
        <AlertTriangle className="w-5 h-5 animate-pulse" />
        <span className="font-bold">SOS Alert</span>
      </motion.button>

      <AnimatePresence>
        {isModalOpen && <SOSModal onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>
    </>
  )
}