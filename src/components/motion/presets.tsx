import { m, type HTMLMotionProps, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const spring = { type: "spring", stiffness: 420, damping: 32 } as const;

export const cardMotion = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const pressMotion = {
  whileHover: { y: -4, scale: 1.012 },
  whileTap: { scale: 0.965 },
  transition: spring,
} as const;

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: "easeOut" } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};

export function Reveal({
  children,
  className,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode; delay?: number }) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        ...fadeUp,
        visible: {
          ...fadeUp.visible,
          transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function StaggerGroup({
  children,
  className,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={stagger}
      className={className}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  return (
    <m.div variants={fadeUp} className={className} {...props}>
      {children}
    </m.div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-card p-3 ring-1 ring-black/[0.05] ${className}`} aria-hidden="true">
      <div className="premium-skeleton aspect-square rounded-lg" />
      <div className="premium-skeleton mt-3 h-4 w-4/5 rounded" />
      <div className="premium-skeleton mt-2 h-3 w-2/5 rounded" />
      <div className="premium-skeleton mt-4 h-7 w-full rounded-lg" />
    </div>
  );
}
