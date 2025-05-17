'use client';

import { motion } from 'framer-motion';

export default function IntegrationPage() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <motion.div
                className="flex-1 overflow-auto p-5 bg-[#f8f9fa]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <h2 className="text-xl font-medium mb-4">Coming Soon</h2>
                        <p className="text-gray-500 text-sm mb-8">
                            The Integration Hub is under development. Soon you'll be able to connect your CRM
                            with various third-party services.
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-8">
                            {['Salesforce', 'HubSpot', 'Gmail'].map((service) => (
                                <motion.div
                                    key={service}
                                    className="border border-gray-200 rounded-md p-4 flex items-center justify-center flex-col opacity-60"
                                    whileHover={{ scale: 1.03, opacity: 0.8 }}
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-full mb-2 flex items-center justify-center">
                                        <span className="text-gray-400 text-lg">{service[0]}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">{service}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
