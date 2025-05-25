

import { WritingText } from '@/components/animate-ui/text/writing';
import { MotionEffect } from '@/components/animate-ui/effects/motion-effect';
import DriveWiseForm from './form';


export default function DriveWisePage() {
  
  return (
    <div className="min-h-screen">
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
        <DriveWiseForm />
      </MotionEffect>
    </div>
  );
} 