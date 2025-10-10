"use client";
import { navLinks } from '@/constant/constant';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { BiPhone } from 'react-icons/bi';
import { FaUserCircle } from 'react-icons/fa';
import { FaHouse } from 'react-icons/fa6';
import { HiBars3BottomRight } from 'react-icons/hi2';
import AuthModal from '@/components/Auth/AuthModal';

type Props = {
  openNav: () => void;
};

const Nav = ({ openNav }: Props) => {
  const [navBg, setNavBg] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Add shadow when scrolled down
      if (currentScrollY > 90) {
        setNavBg(true);
      } else {
        setNavBg(false);
      }
      
      // Hide/show based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        // Scrolling down - hide nav
        setNavVisible(false);
      } else {
        // Scrolling up - show nav
        setNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const handleDropdownToggle = (id: number) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  return (
    <>
      <div
        className={`fixed bg-white ${navBg ? 'shadow-[0_4px_18px_0_rgba(0,0,0,0.078)]' : ''} h-[10vh] z-[100] w-full transition-all duration-300 transform ${navVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="flex items-center h-full justify-between w-[95%] sm:w-[90%] xl:w-[95%] mx-auto">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#3162CC] text-white flex items-center justify-center">
                <FaHouse />
              </div>
              <div className="text-black font-bold text-sm sm:text-base md:text-xl">
                Real Estate Project
              </div>
            </div>
          </Link>
          {/* Nav Links */}
          <div className="lg:flex items-center space-x-4 text-black hidden">
            {navLinks.map((link) => (
              <div key={link.id} className="relative">
                {link.subLinks ? (
                  <div
                    onMouseEnter={() => handleDropdownToggle(link.id)}
                    onMouseLeave={() => handleDropdownToggle(link.id)}
                    className="cursor-pointer"
                  >
                    <p className="p-3 text-black sm:text-base text-base w-100 cursor-pointer hover:text-primary hover:font-semibold transition-all duration-200">
                      {link.label}
                    </p>
                    <ul 
                      className={`py-5 absolute top-full left-0 w-64 transform origin-top transition-all duration-300 ease-out z-50 ${openDropdown === link.id ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-5 scale-95 pointer-events-none'}`}
                    >
                      <div className='bg-white shadow-2xl rounded-lg py-2 transform transition-transform duration-300 ease-out'>
                        {link.subLinks.map((subLink) => {
                          // Determine icon based on subLink label
                          let icon;
                          const label = subLink.label.toLowerCase();
                          if (label.includes('buy')) icon = '🏠';
                          else if (label.includes('sell')) icon = '💰';
                          else if (label.includes('rent')) icon = '🔑';
                          else if (label.includes('map')) icon = '🗺️';
                          else if (label.includes('mortgage')) icon = '📊';
                          else if (label.includes('calculator')) icon = '🧮';
                          else if (label.includes('agent')) icon = '👤';
                          else if (label.includes('about')) icon = 'ℹ️';
                          else if (label.includes('contact')) icon = '📞';
                          else icon = '📋';
                          
                          return (
                            <li key={subLink.id} className="group">
                              <Link
                                href={subLink.url}
                                className=" px-4 py-2.5 text-gray-700 transition-colors group-hover:bg-slate-300 duration-200 flex items-center transform"
                              >
                                <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mr-3 text-lg group-hover:text-white transition-all">
                                  {icon}
                                </span>
                                <div>
                                  <span className="font-medium">{subLink.label}</span>
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                        </div>
                      </ul>
                  </div>
                ) : (
                  <Link href={link.url}>
                    <p className="text-black sm:text-base text-base cursor-pointer hover:text-primary hover:font-semibold transition-all duration-200">
                      {link.label}
                    </p>
                  </Link>
                )}
              </div>
            ))}
          </div>
          {/* Login & Hamburger Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-center  text-black text-sm sm:text-base md:text-lg cursor-pointer hover:text-primary transition-all duration-200">
              <div className='flex items-center'>
                <BiPhone className="w-5 h-5" />
                <p className="hidden sm:block text-xs sm:text-base mx-2">123 456-7890</p>
              </div>
              <span className='text-[10px] leading-3'>Call us 7days/week 9:00 am to 10:00 pm</span>
            </div>
            <div onClick={handleLoginClick} className="flex items-center text-black text-sm sm:text-base md:text-lg cursor-pointer hover:text-primary transition-all duration-200">
              <FaUserCircle className="w-5 h-5" />
              <p className="hidden sm:block text-xs sm:text-base mx-2">Login</p>
            </div>
            <button className={`btn btn-primary sm:text-sm bg-primary hover:text-white`}>
              Submit Property
            </button>
            <HiBars3BottomRight
              onClick={openNav}
              className="text-black w-6 h-6 sm:w-8 sm:h-8 cursor-pointer lg:hidden"
            />
          </div>
        </div>
      </div>

    <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};

export default Nav;