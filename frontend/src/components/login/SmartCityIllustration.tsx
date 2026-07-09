import { motion } from 'framer-motion'

/**
 * Enterprise smart-city SVG illustration with animated traffic paths,
 * digital road network, and minimal futuristic skyline.
 */
export function SmartCityIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      className="relative flex h-full w-full items-center justify-center p-8 lg:p-12"
    >
      {/* Ambient glow behind illustration */}
      <div className="absolute inset-0 bg-gradient-to-r from-tv-primary/[0.08] via-transparent to-tv-emerald/[0.05] blur-3xl" />

      <svg
        viewBox="0 0 800 600"
        className="relative h-full max-h-[560px] w-full max-w-[720px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="AI-powered smart city traffic visualization"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="trafficGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="1" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sky gradient overlay */}
        <rect width="800" height="600" fill="url(#skyGrad)" />

        {/* Minimal futuristic skyline */}
        <g opacity="0.35">
          {[40, 80, 130, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, 760].map(
            (x, i) => {
              const h = 60 + (i % 5) * 35 + (i % 3) * 20
              return (
                <rect
                  key={x}
                  x={x}
                  y={320 - h}
                  width={18 + (i % 4) * 8}
                  height={h}
                  rx="2"
                  fill="#1E293B"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.5"
                />
              )
            },
          )}
        </g>

        {/* Horizon line */}
        <line
          x1="0"
          y1="320"
          x2="800"
          y2="320"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />

        {/* Base road surface */}
        <path
          d="M 0 380 Q 200 370 400 385 T 800 375 L 800 520 L 0 520 Z"
          fill="#1E293B"
          opacity="0.6"
        />

        {/* Secondary roads */}
        <path
          d="M 100 380 L 350 420 L 550 400 L 750 430"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <path
          d="M 50 430 L 300 460 L 500 440 L 780 470"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Digital road network grid */}
        <g opacity="0.15" stroke="rgba(37,99,235,0.4)" strokeWidth="0.5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <line key={`h-${i}`} x1="0" y1={360 + i * 25} x2="800" y2={360 + i * 25} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <line key={`v-${i}`} x1={i * 80} y1="340" x2={i * 80} y2="520" />
          ))}
        </g>

        {/* Main traffic paths — animated */}
        <TrafficPath
          d="M 0 395 Q 150 390 300 400 T 600 392 T 800 398"
          delay={0}
        />
        <TrafficPath
          d="M 0 445 Q 200 455 400 448 T 800 452"
          delay={1.2}
          color="#10B981"
        />
        <TrafficPath
          d="M 150 380 L 350 420 L 550 400 L 750 430"
          delay={2.4}
        />

        {/* Intersection nodes */}
        {[
          [300, 400],
          [400, 448],
          [550, 400],
          [600, 392],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="8" fill="rgba(37,99,235,0.15)" />
            <motion.circle
              cx={cx}
              cy={cy}
              r="4"
              fill="#2563EB"
              filter="url(#softGlow)"
              animate={{ opacity: [0.4, 1, 0.4], r: [3, 5, 3] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeInOut',
              }}
            />
          </g>
        ))}

        {/* Vehicle dots moving along paths */}
        <AnimatedVehicle pathId="path-0" color="#2563EB" duration={8} />
        <AnimatedVehicle pathId="path-1" color="#10B981" duration={10} delay={2} />
        <AnimatedVehicle pathId="path-0" color="#F59E0B" duration={12} delay={4} size={3} />

        {/* Data particles rising from network */}
        {Array.from({ length: 12 }, (_, i) => (
          <motion.circle
            key={`particle-${i}`}
            cx={80 + i * 62}
            cy={480 - (i % 4) * 15}
            r={1 + (i % 3)}
            fill={i % 3 === 0 ? '#2563EB' : i % 3 === 1 ? '#10B981' : '#F59E0B'}
            opacity={0.5}
            animate={{
              cy: [480 - (i % 4) * 15, 340],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 4 + (i % 3) * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* AI analytics overlay panel */}
        <g transform="translate(520, 80)">
          <rect
            width="220"
            height="130"
            rx="12"
            fill="rgba(30,41,59,0.85)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <text x="16" y="28" fill="#94A3B8" fontSize="10" fontFamily="Inter, sans-serif">
            TRAFFIC FLOW ANALYTICS
          </text>
          <text x="16" y="52" fill="#F8FAFC" fontSize="14" fontWeight="600" fontFamily="Inter, sans-serif">
            Congestion Index
          </text>
          <text x="16" y="78" fill="#10B981" fontSize="22" fontWeight="700" fontFamily="Inter, sans-serif">
            23%
          </text>
          <text x="16" y="98" fill="#94A3B8" fontSize="10" fontFamily="Inter, sans-serif">
            ↓ 12% from peak · AI Optimized
          </text>

          {/* Mini chart bars */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.rect
              key={i}
              x={120 + i * 12}
              width="8"
              rx="2"
              fill="#2563EB"
              opacity={0.6}
              animate={{
                height: [20 + (i % 3) * 8, 35 + (i % 4) * 6, 20 + (i % 3) * 8],
                y: [90, 75 - (i % 4) * 6, 90],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </g>

        {/* Left status panel */}
        <g transform="translate(40, 100)">
          <rect
            width="180"
            height="90"
            rx="10"
            fill="rgba(30,41,59,0.75)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          <circle cx="20" cy="28" r="4" fill="#10B981" />
          <text x="32" y="32" fill="#F8FAFC" fontSize="11" fontWeight="500" fontFamily="Inter, sans-serif">
            Network Active
          </text>
          <text x="16" y="58" fill="#94A3B8" fontSize="10" fontFamily="Inter, sans-serif">
            847 sensors online
          </text>
          <text x="16" y="76" fill="#94A3B8" fontSize="10" fontFamily="Inter, sans-serif">
            12 corridors monitored
          </text>
        </g>

        {/* Brand tagline on illustration */}
        <text
          x="40"
          y="560"
          fill="#94A3B8"
          fontSize="13"
          fontFamily="Inter, sans-serif"
          opacity="0.7"
        >
          Real-time AI traffic intelligence for smarter cities
        </text>
      </svg>
    </motion.div>
  )
}

function TrafficPath({
  d,
  delay = 0,
  color = '#2563EB',
}: {
  d: string
  delay?: number
  color?: string
}) {
  const pathId = `path-${delay === 0 ? 0 : delay === 1.2 ? 1 : 2}`

  return (
    <g filter="url(#glow)">
      <path
        id={pathId}
        d={d}
        stroke={color}
        strokeWidth="2"
        strokeOpacity="0.15"
        fill="none"
      />
      <motion.path
        d={d}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="12 200"
        animate={{ strokeDashoffset: [200, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
          delay,
        }}
        opacity={0.8}
      />
    </g>
  )
}

function AnimatedVehicle({
  pathId,
  color,
  duration,
  delay = 0,
  size = 4,
}: {
  pathId: string
  color: string
  duration: number
  delay?: number
  size?: number
}) {
  return (
    <motion.circle
      r={size}
      fill={color}
      filter="url(#softGlow)"
      animate={{
        offsetDistance: ['0%', '100%'],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay,
        times: [0, 0.05, 0.95, 1],
      }}
      style={{
        offsetPath: `path('${getPathD(pathId)}')`,
      }}
    />
  )
}

function getPathD(pathId: string): string {
  if (pathId === 'path-1') {
    return 'M 0 445 Q 200 455 400 448 T 800 452'
  }
  return 'M 0 395 Q 150 390 300 400 T 600 392 T 800 398'
}
