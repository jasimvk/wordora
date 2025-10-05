import { useState } from 'react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clipit-style Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-light text-gray-900">Clipit</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-gray-900 font-light">Features</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 font-light">Pricing</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 font-light">Support</a>
              <button 
                onClick={onGetStarted}
                className="bg-gray-800 text-white px-6 py-2 font-light hover:bg-gray-700 transition-colors"
              >
                Log In
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
            Save articles.<br />
            Read them later.
          </h1>
          <p className="text-xl font-light text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Clipit is the simplest way to save and store articles for reading: offline, on-the-go, anytime, anywhere.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-gray-800 text-white px-8 py-3 text-lg font-light hover:bg-gray-700 transition-colors"
          >
            Try Clipit Free
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h2 className="text-2xl font-light text-gray-900">Simple to save</h2>
            <p className="text-gray-600 font-light leading-relaxed">
              Save articles and web pages from any browser, smartphone, or app. Everything syncs automatically across all your devices.
            </p>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-light text-gray-900">Beautiful to read</h2>
            <p className="text-gray-600 font-light leading-relaxed">
              Enjoy a clean, distraction-free reading experience. Customize fonts, text size, and backgrounds to match your preferences.
            </p>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-light text-gray-900">Works everywhere</h2>
            <p className="text-gray-600 font-light leading-relaxed">
              Read saved articles on any device, even when you're offline. Your reading list is always with you.
            </p>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-light text-gray-900">Smart organization</h2>
            <p className="text-gray-600 font-light leading-relaxed">
              Automatically organize your articles with folders, highlights, and notes. Find what you need instantly with powerful search.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg p-12 border border-gray-200">
          <h3 className="text-3xl font-light text-gray-900 mb-4">
            Ready to start reading?
          </h3>
          <p className="text-gray-600 font-light mb-6">
            Join millions of people using Clipit to save and read articles.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-gray-800 text-white px-8 py-3 text-lg font-light hover:bg-gray-700 transition-colors"
          >
            Get Started Free
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="font-light text-gray-900">Clipit</span>
            </div>
            <div className="flex space-x-6 text-sm font-light text-gray-600">
              <a href="#" className="hover:text-gray-900">Privacy</a>
              <a href="#" className="hover:text-gray-900">Terms</a>
              <a href="#" className="hover:text-gray-900">Help</a>
              <a href="#" className="hover:text-gray-900">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;