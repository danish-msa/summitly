/**
 * Animation utilities and configurations for the real estate platform
 */

export const animations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  
  scaleInCenter: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // Slide animations
  slideInFromTop: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  slideInFromBottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  slideInFromLeft: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  slideInFromRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // Stagger animations for lists
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // Hover animations
  hoverScale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeInOut' }
  },
  
  hoverLift: {
    whileHover: { y: -5 },
    transition: { duration: 0.2, ease: 'easeInOut' }
  },
  
  // Loading animations
  pulse: {
    animate: {
      opacity: [1, 0.5, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },
  
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  },
  
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: 'easeInOut' }
  },
  
  // Modal animations
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  
  modalContent: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // Drawer animations
  drawerOverlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  
  drawerContent: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // Toast animations
  toastSlideIn: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // Property card animations
  propertyCardHover: {
    whileHover: { 
      y: -8,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  },
  
  // Image gallery animations
  imageTransition: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  // Search bar animations
  searchExpand: {
    initial: { width: '200px' },
    animate: { width: '300px' },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // Filter panel animations
  filterSlideIn: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { duration: 0.3, ease: 'easeOut' }
  }
} as const

// Animation variants for common components
export const componentAnimations = {
  button: {
    tap: { scale: 0.95 },
    hover: { scale: 1.05 },
    transition: { duration: 0.1 }
  },
  
  card: {
    hover: { y: -4, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } }
  },
  
  input: {
    focus: { scale: 1.02, transition: { duration: 0.2 } }
  },
  
  badge: {
    hover: { scale: 1.1, transition: { duration: 0.2 } }
  }
} as const

// Utility function to create custom animations
export const createAnimation = (
  initial: any,
  animate: any,
  exit?: any,
  transition?: any
) => ({
  initial,
  animate,
  exit,
  transition: transition || { duration: 0.3, ease: 'easeOut' }
})

// Animation presets for different use cases
export const animationPresets = {
  // For property listings
  propertyList: {
    container: animations.staggerContainer,
    item: animations.staggerItem
  },
  
  // For modals and overlays
  modal: {
    backdrop: animations.modalBackdrop,
    content: animations.modalContent
  },
  
  // For navigation
  navigation: {
    slideIn: animations.slideInFromTop,
    slideOut: animations.slideInFromTop
  },
  
  // For forms
  form: {
    field: animations.fadeInUp,
    error: animations.fadeInDown
  },
  
  // For loading states
  loading: {
    spinner: animations.spin,
    skeleton: animations.pulse
  }
} as const
