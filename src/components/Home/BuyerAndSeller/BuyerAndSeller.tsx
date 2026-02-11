import React from 'react'
import Link from 'next/link'
import { BiSearch } from 'react-icons/bi'
import { GiSellCard } from 'react-icons/gi'
import { HiHomeModern } from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const BuyerAndSeller = () => {
  return (
    <div className='pt-16 pb-16 bg-[url("/images/pattern.png")] relative bg-cover bg-center'>
        <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mt-10 gap-6'>
                {/* Buyer Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className='flex flex-col gap-4 border border-border p-6 bg-card rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105'
                >
                    <div className='flex items-center justify-between'>
                        <h3 className='text-lg font-semibold text-card-foreground'>I am a Buyer</h3>
                        <div className='p-3 bg-primary/10 rounded-xl'>
                            <BiSearch className='h-6 w-6 text-primary' />
                        </div>
                    </div>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                        Become a VIP member today to gain access to our most exclusive listings.
                    </p>
                    <Link href='/buy'>
                        <Button className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-all duration-200 hover:shadow-md'>
                            Sign up for VIP listings
                        </Button>
                    </Link>
                </motion.div>

                {/* Seller Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className='flex flex-col gap-4 border border-border p-6 bg-card rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105'
                >
                    <div className='flex items-center justify-between'>
                        <h3 className='text-lg font-semibold text-card-foreground'>I am a Seller</h3>
                        <div className='p-3 bg-primary/10 rounded-xl'>
                            <GiSellCard className='h-6 w-6 text-primary' />
                        </div>
                    </div>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                        How much is your home worth? Get your home evaluation now.
                    </p>
                    <Link href='/sell'>
                        <Button className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-all duration-200 hover:shadow-md'>
                            Get an instant home evaluation
                        </Button>
                    </Link>
                </motion.div>

                {/* Seller and Buyer Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className='flex flex-col gap-4 border border-border p-6 bg-card rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105'
                >
                    <div className='flex items-center justify-between'>
                        <h3 className='text-lg font-semibold text-card-foreground'>I am a Seller and Buyer</h3>
                        <div className='p-3 bg-primary/10 rounded-xl'>
                            <HiHomeModern className='h-6 w-6 text-primary' />
                        </div>
                    </div>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                        Get a more accurate home evaluation by a Faris Team Realtor®
                    </p>
                    <Link href='/contact'>
                        <Button className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-all duration-200 hover:shadow-md'>
                            Book appointment now
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>   
    </div>
  )
}

export default BuyerAndSeller