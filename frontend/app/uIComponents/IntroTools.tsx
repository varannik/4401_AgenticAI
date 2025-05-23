'use client'

import { MotionEffect } from '@/components/animate-ui/effects/motion-effect'
import Link from 'next/link'

const tools = [
  {
    id: 1,
    name: 'DriveWise',
    description: 'Your Smart Mobility Decision Assistant',
    href: '/tools/DriveWise'
  },
  {
    id: 2,
    name: 'Coming Soon',
    description: 'More exciting tools are on the way',
    href: '#'
  },
  {
    id: 3,
    name: 'Coming Soon',
    description: 'More exciting tools are on the way',
    href: '#'
  },
  {
    id: 4,
    name: 'Coming Soon',
    description: 'More exciting tools are on the way',
    href: '#'
  },
  {
    id: 5,
    name: 'Coming Soon',
    description: 'More exciting tools are on the way',
    href: '#'
  },
  {
    id: 6,
    name: 'Coming Soon',
    description: 'More exciting tools are on the way',
    href: '#'
  }
]

const styles = `
.cursor-box {
  position: relative;
  overflow: hidden;
}

.cursor-box::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
  top: -100%;
  left: -100%;
  transition: all 0.5s ease;
}

.cursor-box:hover::before {
  top: 100%;
  left: 100%;
}

.cursor-box:hover {
  transform: scale(1.05) translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 188, 212, 0.3);
}

.help {
  cursor: help;
  background: linear-gradient(145deg, #2a2a2a, #383838);
  border: 2px solid #00bcd4;
}

.help:hover {
  transform: scale(1.05) translateY(-5px);
  box-shadow: 0 5px 15px #00bcd450;
}
`

export const IntroTools = () => {
  return (
    <>
      <style>{styles}</style>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {Array.from({ length: 2 }).map((_, columnIndex) => (
          <MotionEffect
            key={columnIndex}
            slide={{
              direction: 'down',
            }}
            fade
            zoom
            inView
            delay={0.5 + columnIndex * 0.1}
          >
            <div className="flex flex-col gap-6 items-center">
              {tools.slice(columnIndex * 3, (columnIndex + 1) * 3).map((tool) => (
                <Link 
                  key={tool.id}
                  href={tool.href}
                  className="block w-full max-w-sm"
                >
                  <div
                    className="bg-white/30 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-white/20 hover:bg-white/40 transition-all duration-300 cursor-pointer cursor-box"
                  >
                    <div className="h-32 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                      <span className="text-gray-900 font-semibold text-lg">{tool.name}</span>
                      <span className="text-gray-600 text-sm">{tool.description}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </MotionEffect>
        ))}
      </div>
    </>
  );
};



