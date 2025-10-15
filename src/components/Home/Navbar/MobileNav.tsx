"use client";
import { navLinks } from '@/lib/constants/navigation';
import Link from 'next/link';
import React from 'react';
import { CgClose } from 'react-icons/cg';
import { FaHome, FaMapMarkedAlt, FaBuilding, FaExchangeAlt, FaEllipsisH, FaInfoCircle, FaPhone, FaCalculator, FaUserCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Props = {
    showNav: boolean
    closeNav: () => void
}

const MobileNav = ({ closeNav, showNav }: Props) => {
    // Map icons to nav links
    const getIcon = (label: string) => {
        switch(label.toLowerCase()) {
            case 'home':
                return <FaHome className="text-xl" />;
            case 'listings':
                return <FaBuilding className="text-xl" />;
            case 'map search':
                return <FaMapMarkedAlt className="text-xl" />;
            case 'buy & sell':
                return <FaExchangeAlt className="text-xl" />;
            case 'more':
                return <FaEllipsisH className="text-xl" />;
            case 'about':
                return <FaInfoCircle className="text-xl" />;
            case 'contact':
                return <FaPhone className="text-xl" />;
            case 'calculator':
                return <FaCalculator className="text-xl" />;
            default:
                return <FaHome className="text-xl" />;
        }
    };
    
    return (
        <AnimatePresence>
            {showNav && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]"
                        onClick={closeNav}
                    />
                    
                    {/* Slide-in Menu */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ 
                            type: "spring", 
                            damping: 30, 
                            stiffness: 300 
                        }}
                        className="fixed top-0 left-0 h-full w-[85%] sm:w-[70%] md:w-[50%] bg-background border-r border-border z-[10000] shadow-2xl"
                    >
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex justify-between items-center p-6 border-b border-border"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center">
                                        <FaHome className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-foreground text-xl font-bold">Summitly</h2>
                                        <p className="text-muted-foreground text-xs">Real Estate Excellence</p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={closeNav}
                                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <CgClose className="w-6 h-6" />
                                </motion.button>
                            </motion.div>
                            
                            {/* User Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="p-6 border-b border-border"
                            >
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                        <FaUserCircle className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Welcome back!</p>
                                        <p className="text-sm text-muted-foreground">Sign in to your account</p>
                                    </div>
                                </div>
                                <Button className="w-full" size="sm">
                                    Sign In / Register
                                </Button>
                            </motion.div>
                            
                            {/* Navigation Links */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex-1 overflow-y-auto py-6"
                            >
                                <div className="px-6 mb-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        Navigation
                                    </h3>
                                </div>
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + index * 0.05 }}
                                    >
                                        <Link href={link.url} onClick={closeNav}>
                                            <motion.div 
                                                className="flex items-center gap-4 px-6 py-4 hover:bg-accent transition-colors group"
                                                whileHover={{ x: 4 }}
                                            >
                                                <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    {getIcon(link.label)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-foreground font-medium">
                                                        {link.label}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>
                            
                            {/* Footer Actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="p-6 border-t border-border space-y-3"
                            >
                                <Button className="w-full" size="sm">
                                    Submit Property
                                </Button>
                                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                                    <FaPhone className="w-4 h-4" />
                                    <span>123 456-7890</span>
                                    <Badge variant="secondary" className="text-xs">
                                        24/7
                                    </Badge>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default MobileNav