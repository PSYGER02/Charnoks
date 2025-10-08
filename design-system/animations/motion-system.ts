/* ==================================================
   CHARNOKS ADVANCED MOTION SYSTEM
   Physics-based animations with emotional intelligence
   ================================================== */

import { Variants, Transition } from 'framer-motion';

/* ==================================================
   CORE ANIMATION PRESETS
   ================================================== */

// Easing Functions - Inspired by Apple's design language
export const easings = {
  // Basic easings
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],

  // Custom brand easings
  charnoks: [0.32, 0.72, 0, 1], // Signature brand easing
  gentle: [0.25, 0.46, 0.45, 0.94], // Gentle, comfortable motion
  snappy: [0.68, -0.55, 0.265, 1.55], // Quick, playful bounce
  smooth: [0.16, 1, 0.3, 1], // Smooth, flowing motion
  dramatic: [0.87, 0, 0.13, 1], // Dramatic, attention-grabbing

  // Specialized easings
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275],
  back: [0.68, -0.55, 0.265, 1.55],
  anticipate: [0.22, 1, 0.36, 1],
  overshoot: [0.25, 0.46, 0.45, 0.94]
} as const;

// Duration Scale
export const durations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 750,
  slowest: 1000,
  
  // Contextual durations
  micro: 100,   // Micro-interactions
  UI: 200,      // UI state changes
  page: 400,    // Page transitions
  layout: 300,  // Layout changes
  data: 500     // Data loading states
} as const;

/* ==================================================
   SEMANTIC ANIMATION VARIANTS
   ================================================== */

// Entrance Animations
export const entranceVariants: Variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.normal, ease: easings.easeOut }
  },

  slideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: durations.normal, ease: easings.charnoks }
  },

  slideDown: {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 12 },
    transition: { duration: durations.normal, ease: easings.charnoks }
  },

  slideLeft: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
    transition: { duration: durations.normal, ease: easings.charnoks }
  },

  slideRight: {
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 12 },
    transition: { duration: durations.normal, ease: easings.charnoks }
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: durations.normal, ease: easings.gentle }
  },

  scaleUp: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: durations.slow, ease: easings.bounce }
  },

  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: durations.fast, ease: easings.easeOut }
  },

  flipIn: {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: 90 },
    transition: { duration: durations.slow, ease: easings.back }
  },

  zoomIn: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: durations.normal, ease: easings.elastic }
  }
};

// Interactive Animations
export const interactionVariants: Variants = {
  hover: {
    scale: 1.02,
    y: -2,
    transition: { duration: durations.fast, ease: easings.easeOut }
  },

  hoverLift: {
    scale: 1.03,
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    transition: { duration: durations.fast, ease: easings.easeOut }
  },

  tap: {
    scale: 0.98,
    transition: { duration: durations.micro, ease: easings.easeInOut }
  },

  tapStrong: {
    scale: 0.95,
    transition: { duration: durations.micro, ease: easings.easeInOut }
  },

  focus: {
    scale: 1.01,
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
    transition: { duration: durations.fast, ease: easings.easeOut }
  },

  float: {
    y: [-2, 2, -2],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: easings.easeInOut
    }
  },

  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easings.easeInOut
    }
  },

  breathe: {
    scale: [1, 1.02, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: easings.easeInOut
    }
  }
};

// Loading Animations
export const loadingVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  },

  bounce: {
    y: [0, -20, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: easings.easeOut
    }
  },

  dots: {
    scale: [1, 1.5, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: easings.easeInOut
    }
  },

  wave: {
    y: [0, -10, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: easings.easeInOut,
      delay: 0.1
    }
  },

  shimmer: {
    x: [-100, 100],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }
  },

  skeleton: {
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: easings.easeInOut
    }
  }
};

// Page Transition Variants
export const pageVariants: Variants = {
  slideLeftToRight: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
    transition: { duration: durations.page, ease: easings.charnoks }
  },

  slideRightToLeft: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
    transition: { duration: durations.page, ease: easings.charnoks }
  },

  slideUpToDown: {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
    transition: { duration: durations.page, ease: easings.charnoks }
  },

  slideDownToUp: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
    transition: { duration: durations.page, ease: easings.charnoks }
  },

  fadeThrough: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.page, ease: easings.easeInOut }
  },

  scaleTransition: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
    transition: { duration: durations.page, ease: easings.gentle }
  }
};

// Modal & Overlay Variants
export const modalVariants: Variants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.normal, ease: easings.easeOut }
  },

  modal: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 20 },
    transition: { duration: durations.normal, ease: easings.charnoks }
  },

  slideUp: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
    transition: { duration: durations.slow, ease: easings.charnoks }
  },

  slideDown: {
    initial: { y: "-100%" },
    animate: { y: 0 },
    exit: { y: "-100%" },
    transition: { duration: durations.slow, ease: easings.charnoks }
  }
};

// List Animation Variants
export const listVariants: Variants = {
  container: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },

  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: durations.normal, ease: easings.easeOut }
  }
};

/* ==================================================
   SPECIALIZED ANIMATION SEQUENCES
   ================================================== */

// Success Feedback Animation
export const successSequence: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.6,
      times: [0, 0.3, 1],
      ease: easings.bounce
    }
  }
};

// Error Shake Animation
export const errorShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -8, 8, -8, 8, 0],
    transition: {
      duration: 0.5,
      ease: easings.easeInOut
    }
  }
};

// Attention Seeking Animation
export const attentionPulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: 3,
      ease: easings.easeInOut
    }
  }
};

// Loading Dots Sequence
export const loadingDots = {
  dot1: {
    scale: [1, 1.5, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: easings.easeInOut,
      delay: 0
    }
  },
  dot2: {
    scale: [1, 1.5, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: easings.easeInOut,
      delay: 0.2
    }
  },
  dot3: {
    scale: [1, 1.5, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: easings.easeInOut,
      delay: 0.4
    }
  }
};

/* ==================================================
   GESTURE ANIMATIONS
   ================================================== */

// Swipe Gesture Animations
export const swipeVariants: Variants = {
  swipeLeft: {
    x: -100,
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn }
  },

  swipeRight: {
    x: 100,
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn }
  },

  swipeUp: {
    y: -100,
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn }
  },

  swipeDown: {
    y: 100,
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn }
  }
};

// Drag & Drop Animations
export const dragVariants: Variants = {
  dragStart: {
    scale: 1.05,
    rotate: 2,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    zIndex: 1000,
    transition: { duration: durations.fast, ease: easings.easeOut }
  },

  dragEnd: {
    scale: 1,
    rotate: 0,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    zIndex: "auto",
    transition: { duration: durations.normal, ease: easings.charnoks }
  }
};

/* ==================================================
   THEME-SPECIFIC ANIMATIONS
   ================================================== */

// Glassmorphism reveal animation
export const glassReveal: Variants = {
  initial: { 
    opacity: 0, 
    backdropFilter: "blur(0px)",
    backgroundColor: "rgba(255, 255, 255, 0)"
  },
  animate: { 
    opacity: 1, 
    backdropFilter: "blur(20px)",
    backgroundColor: "rgba(255, 255, 255, 0.1)"
  },
  exit: { 
    opacity: 0, 
    backdropFilter: "blur(0px)",
    backgroundColor: "rgba(255, 255, 255, 0)"
  },
  transition: { duration: durations.slow, ease: easings.gentle }
};

// Gradient animation for backgrounds
export const gradientShift: Variants = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

/* ==================================================
   ACCESSIBILITY CONSIDERATIONS
   ================================================== */

// Reduced motion variants for accessibility
export const reducedMotionVariants: Variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.fast }
  },

  scaleIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.fast }
  },

  slideUp: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.fast }
  }
};

/* ==================================================
   ANIMATION UTILITIES
   ================================================== */

// Helper function to get appropriate variants based on user preferences
export const getMotionVariants = (preferReducedMotion: boolean, variants: Variants) => {
  if (preferReducedMotion) {
    return reducedMotionVariants;
  }
  return variants;
};

// Spring configurations for natural motion
export const springConfigs = {
  gentle: { type: "spring", stiffness: 300, damping: 30 },
  bouncy: { type: "spring", stiffness: 400, damping: 17 },
  snappy: { type: "spring", stiffness: 500, damping: 25 },
  wobbly: { type: "spring", stiffness: 180, damping: 12 },
  stiff: { type: "spring", stiffness: 1000, damping: 100 }
} as const;

// Stagger configurations for list animations
export const staggerConfigs = {
  fast: { staggerChildren: 0.05, delayChildren: 0.1 },
  normal: { staggerChildren: 0.1, delayChildren: 0.2 },
  slow: { staggerChildren: 0.2, delayChildren: 0.3 },
  dramatic: { staggerChildren: 0.3, delayChildren: 0.5 }
} as const;

/* ==================================================
   ANIMATION PRESETS FOR COMMON USE CASES
   ================================================== */

export const animationPresets = {
  // Button interactions
  buttonPress: {
    whileTap: { scale: 0.98 },
    whileHover: { scale: 1.02, y: -1 },
    transition: { duration: durations.micro, ease: easings.easeOut }
  },

  // Card interactions
  cardHover: {
    whileHover: { 
      y: -4, 
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
    },
    transition: { duration: durations.fast, ease: easings.easeOut }
  },

  // Input focus
  inputFocus: {
    whileFocus: { 
      scale: 1.01,
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)"
    },
    transition: { duration: durations.fast, ease: easings.easeOut }
  },

  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: durations.page, ease: easings.charnoks }
  },

  // Loading states
  loadingPulse: {
    animate: {
      opacity: [0.4, 0.8, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: easings.easeInOut
      }
    }
  }
};

/* ==================================================
   EXPORT ALL ANIMATION SYSTEMS
   ================================================== */

export {
  entranceVariants,
  interactionVariants,
  loadingVariants,
  pageVariants,
  modalVariants,
  listVariants,
  swipeVariants,
  dragVariants,
  glassReveal,
  gradientShift,
  successSequence,
  errorShake,
  attentionPulse,
  loadingDots
};

// Default export with commonly used animations
export default {
  easings,
  durations,
  entranceVariants,
  interactionVariants,
  loadingVariants,
  pageVariants,
  modalVariants,
  listVariants,
  animationPresets,
  springConfigs,
  staggerConfigs,
  getMotionVariants
};