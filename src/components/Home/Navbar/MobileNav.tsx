"use client";
import { navLinks } from '@/constant/constant'
import Link from 'next/link';
import React from 'react'
import { CgClose } from 'react-icons/cg';
import { FaHome, FaMapMarkedAlt, FaBuilding, FaExchangeAlt, FaEllipsisH, FaInfoCircle, FaPhone, FaCalculator } from 'react-icons/fa';

type Props = {
    showNav: boolean
    closeNav: () => void
}

const MobileNav = ({ closeNav, showNav }: Props) => {
    const navOpen = showNav ? "translate-x-0" : "translate-x-[-100%]";
    
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
        <>
            {/* Slide-in Menu */}
            <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] transition-opacity duration-300 ${showNav ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeNav}></div>
            
            <div className={`fixed top-0 left-0 h-full w-[80%] sm:w-[60%] bg-primary z-[1000] transform transition-transform duration-300 ease-in-out ${navOpen} shadow-2xl`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-white/20">
                        <h2 className="text-white text-xl font-bold">Menu</h2>
                        <CgClose onClick={closeNav} className='text-white w-6 h-6 cursor-pointer hover:text-yellow-300 transition-colors'/>
                    </div>
                    
                    {/* Links */}
                    <div className="flex-1 overflow-y-auto py-6">
                        {navLinks.map((link) => (
                            <Link key={link.id} href={link.url} onClick={closeNav}>
                                <div className='flex items-center gap-4 px-6 py-4 hover:bg-white/10 transition-colors'>
                                    <div className="w-8 text-yellow-300">
                                        {getIcon(link.label)}
                                    </div>
                                    <p className='text-[18px] text-white font-medium'>
                                        {link.label}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-6 border-t border-white/20">
                        <Link href="/contact" onClick={closeNav}>
                            <button className="w-full py-3 bg-yellow-400 text-primary font-bold rounded-lg hover:bg-yellow-300 transition-colors">
                                Contact Us
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Bottom Navigation Bar - Always visible on mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white z-[900] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                <div className="flex justify-around items-center h-16">
                    {navLinks.slice(0, 5).map((link) => (
                        <Link key={link.id} href={link.url}>
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-primary hover:text-secondary transition-colors">
                                    {getIcon(link.label)}
                                </div>
                                <span className="text-xs mt-1 text-gray-700">{link.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

export default MobileNav