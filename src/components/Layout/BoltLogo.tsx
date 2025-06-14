import React from 'react';

const BoltLogo: React.FC = () => {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-all duration-300 hover:scale-110 hover:opacity-80 group"
        title="Powered by Bolt.new"
      >
        <div className="relative">
          <img
            src="/black_circle_360x360.png"
            alt="Powered by Bolt.new"
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-[90px] md:h-[90px] drop-shadow-lg transition-all duration-300 group-hover:drop-shadow-xl"
          />
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 md:w-[90px] md:h-[90px] rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        </div>
      </a>
    </div>
  );
};

export default BoltLogo;