import { useState } from 'react';
import { BookOpenIcon, StarIcon, DevicePhoneMobileIcon, MagnifyingGlassIcon, ChartBarIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const LandingPage = ({ onGetStarted }) => {
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: <BookOpenIcon className="h-10 w-10 mx-auto text-red-500" />, // Save Anything
      title: 'Save Anything',
      description: 'Articles, PDFs, and documents from anywhere on the web'
    },
    {
      icon: <StarIcon className="h-10 w-10 mx-auto text-yellow-400" />, // Organize
      title: 'Organize',
      description: 'Favorite important reads and organize with tags'
    },
    {
      icon: <DevicePhoneMobileIcon className="h-10 w-10 mx-auto text-blue-500" />, // Read Later
      title: 'Read Later',
      description: 'Clean, distraction-free reading experience'
    },
    {
      icon: <MagnifyingGlassIcon className="h-10 w-10 mx-auto text-green-500" />, // Search
      title: 'Search',
      description: 'Find your saved content instantly with smart search'
    },
    {
      icon: <ChartBarIcon className="h-10 w-10 mx-auto text-purple-500" />, // Track Progress
      title: 'Track Progress',
      description: 'Monitor your reading progress and completed articles'
    },
    {
      icon: <ArchiveBoxIcon className="h-10 w-10 mx-auto text-gray-500" />, // Archive
      title: 'Archive',
      description: 'Keep your reading list organized with archive feature'
    }
  ];

  return (
  <div className="min-h-screen flex flex-col bg-white">
      {/* Minimal Header */}
  <header className="py-2 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto flex items-center justify-center px-2 sm:px-4">
            <span className="inline-flex items-center">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                <rect width="32" height="32" rx="8" fill="#EF4444"/>
                <text x="16" y="21" textAnchor="middle" fontFamily="Graphik, Inter, sans-serif" fontWeight="bold" fontSize="18" fill="white">B</text>
              </svg>
            </span>
            <span className="ml-2 text-base font-semibold text-gray-900 font-graphik tracking-tight">Booklet</span>
          </div>
        </header>

      {/* Minimal Hero */}
  <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-8 min-h-0">
  <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-3 sm:mb-4 font-graphik tracking-tight leading-tight text-center">
          Save It, Read It Later
        </h1>
  <p className="text-sm xs:text-base sm:text-lg text-gray-500 mb-3 sm:mb-5 max-w-xs xs:max-w-sm sm:max-w-xl text-center font-graphik">
          Booklet lets you save articles, PDFs, and documents from anywhere on the web, then read them anytime in a clean, distraction-free interface—online or offline.
        </p>
  <div className="w-full flex justify-center mb-3 sm:mb-4">
          <button
            onClick={onGetStarted}
            className="bg-red-500 text-white w-full xs:w-auto px-4 py-1.5 rounded-full text-xs xs:text-sm font-medium hover:bg-red-600 transition-colors font-graphik shadow-sm"
            style={{ maxWidth: 200 }}
          >
            Start Reading
          </button>
        </div>

        {/* Minimal Features - show only 3 on mobile, scrollable if more */}
        <div className="flex w-full max-w-xs xs:max-w-md sm:max-w-2xl overflow-x-auto gap-4 sm:gap-8 mt-2 sm:mt-4 pb-2 hide-scrollbar">
          {features.slice(0, 3).map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[90px] py-2">
              <div className="mb-1">{feature.icon}</div>
              <span className="text-xs sm:text-sm font-medium text-gray-900 font-graphik mb-0.5 text-center">{feature.title}</span>
              <span className="text-[11px] sm:text-xs text-gray-400 text-center font-graphik">{feature.description}</span>
            </div>
          ))}
        </div>
  </main>
        {/* App Store / Play Store Coming Soon Section */}
        <div className="w-full flex flex-col items-center mt-4 mb-2">
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 mb-2 w-full max-w-xs xs:max-w-md">
            <img src="/appstore.png" alt="Download on the App Store" className="h-10 w-auto rounded shadow opacity-60" style={{ filter: 'grayscale(1)' }} />
            <img src="/googleplay.png" alt="Get it on Google Play" className="h-10 w-auto rounded shadow opacity-60" style={{ filter: 'grayscale(1)' }} />
            <img src="/chromewebstore.png" alt="Available in the Chrome Web Store" className="h-8 w-auto rounded shadow opacity-60" style={{ filter: 'grayscale(1)' }} />
          </div>
        </div>
    

      {/* Minimal Footer */}
  <footer className="py-2 border-t border-gray-100 mt-auto">
          <div className="max-w-2xl mx-auto px-2 sm:px-4 text-center">
            <span className="text-[9px] text-gray-300 font-graphik">Booklet &mdash; Read Later</span>
          </div>
        </footer>
    </div>
  );
};

export default LandingPage;