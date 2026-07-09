import { motion } from 'framer-motion'

/** Deterministic pseudo-random for consistent particle positions */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

const PARTICLE_COUNT = 28
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: seededRandom(i * 1.7) * 100,
  y: seededRandom(i * 2.3) * 100,
  size: 1.5 + seededRandom(i * 3.1) * 2.5,
  delay: seededRandom(i * 4.2) * 4,
  duration: 6 + seededRandom(i * 5.5) * 8,
}))

const CONNECTIONS = [
  { x1: 10, y1: 20, x2: 35, y2: 45 },
  { x1: 35, y1: 45, x2: 62, y2: 28 },
  { x1: 62, y1: 28, x2: 88, y2: 55 },
  { x1: 15, y1: 70, x2: 45, y2: 82 },
  { x1: 45, y1: 82, x2: 78, y2: 75 },
  { x1: 25, y1: 35, x2: 55, y2: 65 },
  { x1: 70, y1: 15, x2: 92, y2: 38 },
]

/**
 * Subtle animated background with floating particles and connection lines.
 */
export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Radial gradient depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-tv-bg via-[#0c1222] to-[#0a0f1a]" />

      {/* Soft primary glow */}
      <div className="absolute -top-1/4 left-1/4 h-[600px] w-[600px] rounded-full bg-tv-primary/[0.06] blur-[120px]" />
      <div className="absolute -bottom-1/4 right-0 h-[500px] w-[500px] rounded-full bg-tv-emerald/[0.04] blur-[100px]" />

      {/* Grid overlay */}
      <div className="tv-grid-bg absolute inset-0 opacity-40" />

      {/* Connection lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {CONNECTIONS.map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(37, 99, 235, 0.15)"
            strokeWidth="0.08"
            animate={{ opacity: [0.06, 0.22, 0.06] }}
            transition={{
              duration: 5 + i * 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </svg>

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-tv-primary/40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -18, 0],
            x: [0, 6, 0],
            opacity: [0.15, 0.55, 0.15],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  )
}
