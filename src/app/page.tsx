"use client"

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
            <span className="text-blue-600 block sm:inline">Sales</span> Pipeline Manager
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-medium text-gray-700 mb-8 max-w-3xl mx-auto">
            Intuitive CRM that brings customers into every decision
          </h2>
          
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Manage your leads, track your sales pipeline, and close more deals with our intuitive CRM board.
            Our lightweight solution helps you stay organized without the complexity.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative w-full max-w-5xl mx-auto mt-8"
        >
          <div className="relative flex justify-center">
            <motion.div 
              initial={{ x: -20, y: 20, rotate: -5 }}
              animate={{ x: -60, y: 30, rotate: -8 }}
              transition={{ delay: 0.4, duration: 1.2, type: "spring" }}
              className="absolute w-72 sm:w-80 h-48 sm:h-52 bg-white rounded-xl shadow-lg p-5 transform -rotate-6 border border-gray-200 z-10 hidden sm:block"
            >
              <div className="h-5 w-28 bg-blue-100 rounded mb-3"></div>
              <div className="h-3 w-48 bg-gray-100 rounded mb-2"></div>
              <div className="h-3 w-40 bg-gray-100 rounded mb-4"></div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 mr-3"></div>
                <div>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 w-16 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-5">
                <div className="h-5 w-16 bg-green-100 rounded"></div>
                <div className="h-4 w-24 bg-blue-50 rounded"></div>
              </div>
            </motion.div>
            
            {/* Card 2 - main card */}
            <motion.div 
              initial={{ scale: 1 }}
              animate={{ y: -5 }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 1.8
              }}
              className="w-72 sm:w-80 h-48 sm:h-52 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-xl p-5 z-30 text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-32 bg-white/20 rounded"></div>
                <div className="h-6 w-6 bg-white/20 rounded-full"></div>
              </div>
              <div className="h-3 w-48 bg-white/10 rounded mb-2"></div>
              <div className="h-3 w-56 bg-white/10 rounded mb-3"></div>
              <div className="h-3 w-40 bg-white/10 rounded mb-6"></div>
              <div className="flex justify-between items-center mt-5">
                <div className="h-8 w-20 bg-white/20 rounded-lg"></div>
                <div className="text-white font-bold text-xl">$85,200</div>
              </div>
            </motion.div>
          
            <motion.div 
              initial={{ x: 20, y: 20, rotate: 5 }}
              animate={{ x: 60, y: 40, rotate: 8 }}
              transition={{ delay: 0.4, duration: 1.2, type: "spring" }}
              className="absolute w-72 sm:w-80 h-48 sm:h-52 bg-white rounded-xl shadow-lg p-5 transform rotate-6 border border-gray-200 z-20 hidden sm:block"
            >
              <div className="h-5 w-28 bg-purple-100 rounded mb-3"></div>
              <div className="h-3 w-48 bg-gray-100 rounded mb-2"></div>
              <div className="h-3 w-40 bg-gray-100 rounded mb-4"></div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 mr-3"></div>
                <div>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 w-16 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-5">
                <div className="h-5 w-16 bg-yellow-100 rounded"></div>
                <div className="h-4 w-24 bg-purple-50 rounded"></div>
              </div>
            </motion.div>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-24 sm:mt-36 text-center"
          >
            <Link href="/board">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium text-base py-3 px-8 rounded-full shadow-md border-2 border-indigo-400/30"
              >
                Go to Dashboard →
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
      
      <footer className="py-6 text-center text-gray-500 text-sm mt-10">
        <p>© 2023 Mini CRM. All rights reserved.</p>
      </footer>
    </div>
  );
}
