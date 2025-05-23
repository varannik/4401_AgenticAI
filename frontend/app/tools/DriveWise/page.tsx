'use client';
import { useState } from 'react';
import { WritingText } from '@/components/animate-ui/text/writing';
import { MotionEffect } from '@/components/animate-ui/effects/motion-effect';


export default function DriveWisePage() {
  const [timeUnit, setTimeUnit] = useState('d');
  const [count, setCount] = useState(1);

  return (
    <div className="min-h-screen ">
      <header className="">
        <div className="max-w-7xl mx-auto py-6 px-8">
          <WritingText
            className="text-2xl text-[#070808]"
            text="DriveWise"
            spacing={9}
          />
        </div>
      </header>

      <MotionEffect slide inView>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            
            <div className="bg-white/30 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-white/20 hover:bg-white/40 transition-all duration-300 cursor-pointer cursor-box p-8 rounded-lg shadow-md w-full max-w-md ">

              <h2 className="text-l font-semibold mb-6 text-center">
                Choose the time unit you need the car 
              </h2>
              
              <div className="space-y-4">
                <div className="flex flex-col space-y-2 text-gray-700">

                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Count
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setCount(Math.max(1, count - 1))}
                      className="px-3 py-1 border rounded-md hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium">{count}</span>
                    <button
                      onClick={() => setCount(count + 1)}
                      className="px-3 py-1 border rounded-md hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </MotionEffect>
    </div>
  );
} 