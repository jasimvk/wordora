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
      <header className="py-4 border-b border-gray-100 sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-3 sm:px-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900 font-graphik tracking-tight">Booklet</span>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-red-500 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-red-600 transition-colors font-graphik"
            style={{ minWidth: 90 }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Minimal Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 py-6 sm:py-10 min-h-0">
        <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-2 sm:mb-3 font-graphik tracking-tight leading-tight text-center">
          Save. Organize. Read.
        </h1>
        <p className="text-sm xs:text-base sm:text-lg text-gray-500 mb-3 sm:mb-6 max-w-xs xs:max-w-sm sm:max-w-xl text-center font-graphik">
          Booklet lets you save articles, PDFs, and documents from anywhere on the web, then read them anytime in a clean, distraction-free interface—online or offline.
        </p>
        <div className="w-full flex justify-center mb-3 sm:mb-6">
          <button
            onClick={onGetStarted}
            className="bg-red-500 text-white w-full xs:w-auto px-5 py-2 rounded-full text-sm xs:text-base font-medium hover:bg-red-600 transition-colors font-graphik shadow-sm"
            style={{ maxWidth: 320 }}
          >
            Start Reading
          </button>
        </div>

        {/* Minimal Features - show only 3 on mobile, scrollable if more */}
        <div className="flex w-full max-w-xs xs:max-w-md sm:max-w-2xl overflow-x-auto gap-4 sm:gap-8 mt-2 sm:mt-6 pb-2 hide-scrollbar">
          {features.slice(0, 3).map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[90px] py-2">
              <div className="mb-1">{feature.icon}</div>
              <span className="text-xs sm:text-sm font-medium text-gray-900 font-graphik mb-0.5 text-center">{feature.title}</span>
              <span className="text-[11px] sm:text-xs text-gray-400 text-center font-graphik">{feature.description}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-gray-100 mt-auto">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 text-center">
          <span className="text-xs text-gray-400 font-graphik">Booklet &mdash; Personal Library &middot; Bookmark & Read Later</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;