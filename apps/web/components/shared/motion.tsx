"use client"

import { motion } from "framer-motion"

// Page transition wrapper — fade-in + slide-up
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

// Hover card — translateY -2px + shadow on hover
export const MotionCard = motion.div

export const cardHoverProps = {
  whileHover: { y: -2, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" },
  transition: { duration: 0.2, ease: "easeOut" },
} as const

// Modal scale animation
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
} as const

export const modalTransition = {
  duration: 0.2,
  ease: "easeOut",
} as const
