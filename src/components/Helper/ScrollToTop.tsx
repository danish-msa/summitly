"use client"
import React, { useEffect, useCallback } from 'react'
import { FaArrowUp } from 'react-icons/fa'

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = React.useState(false)

    const debounce = <T extends (...args: unknown[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void => {
        let timeout: NodeJS.Timeout
        return (...args: Parameters<T>) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => func(...args), wait)
        }
    }

    const toggleVisibility = useCallback(() => {
        if (window.scrollY > 300) setIsVisible(true)
        else setIsVisible(false)
    }, [])

    useEffect(() => {
        const debouncedToggleVisibility = debounce(toggleVisibility, 150)
        window.addEventListener('scroll', debouncedToggleVisibility)

        return () => {
            window.removeEventListener('scroll', debouncedToggleVisibility)
        }
    }, [toggleVisibility])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    return (
        <div className='fixed bottom-4 animate-pulse right-2 z-50'>
            {isVisible && (
                <button 
                    onClick={scrollToTop} 
                    className='bg-secondary text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all duration-300'
                    aria-label="Scroll to top"
                >
                    <FaArrowUp />
                </button>
            )}
        </div>
    )
}

export default ScrollToTop