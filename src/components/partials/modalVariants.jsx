export const modalVariants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const contentVariants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const childVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 10 },
};

export const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2, // Slightly faster hide
      ease: [0.4, 0, 0.2, 1],
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring", // Use a spring physics animation
      stiffness: 400, // Controls the "strength" of the spring
      damping: 30,    // Controls how much the spring oscillates
      restDelta: 0.001 // Stops the animation when velocity is low
      // duration: 0.3, // Duration is less relevant with spring, but can still be used as max
      // ease: [0.4, 0, 0.2, 1], // Ease function typically not used with spring type
    },
  },
  exit: {
    opacity: 0,
    y: -5, // Slightly less displacement on exit for a quicker fade
    scale: 0.98, // Smaller scale change on exit
    transition: {
      duration: 0.15, // Faster exit for a snappier feel
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const stepVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
};