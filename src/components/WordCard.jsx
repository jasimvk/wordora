import { useState } from 'react';

const WordCard = ({ word }) => {
  const [selectedExample, setSelectedExample] = useState('basic');

  if (!word) return null;

  return (
    <article className="article-container">
      {/* Article Header */}
      <div className="article-header">
        <h1 className="article-headline">{word.word}</h1>
        <p className="article-subhead">"{word.meaning}"</p>
        <div className="nyt-byline mt-4">
          By The Booklet Editorial Team
        </div>
      </div>

      {/* Article Content */}
      <div className="article-content">
        {/* Etymology Section */}
        <div className="etymology-section">
          <div className="nyt-section-header">Definition & Context</div>
          <p className="text-gray-700 leading-relaxed">
            The word <strong>{word.word.toLowerCase()}</strong> means <em>{word.meaning.toLowerCase()}</em>. 
            This term has found its way into contemporary usage, appearing in literature, journalism, 
            and everyday conversation as a precise way to express this particular concept.
          </p>
        </div>

        {/* Usage Examples */}
        <div className="usage-examples">
          <div className="nyt-section-header">Usage in Context</div>
          
          {/* Example Navigation */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setSelectedExample('basic')}
              className={`pb-2 text-sm font-medium transition-colors ${ 
                selectedExample === 'basic' 
                  ? 'border-b-2 border-black text-black' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Usage
            </button>
            <button
              onClick={() => setSelectedExample('contextual')}
              className={`pb-2 text-sm font-medium transition-colors ${ 
                selectedExample === 'contextual' 
                  ? 'border-b-2 border-black text-black' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Contextual Example
            </button>
          </div>

          {/* Selected Example */}
          {selectedExample === 'basic' && (
            <div className="example-block">
              <div className="example-label">Standard Application</div>
              <blockquote className="example-text">
                "{word.example}"
              </blockquote>
            </div>
          )}

          {selectedExample === 'contextual' && (
            <div className="example-block">
              <div className="example-label">Real-World Context</div>
              <blockquote className="example-text">
                "{word.realExample}"
              </blockquote>
            </div>
          )}
        </div>

        {/* Article Tools */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <button 
                onClick={() => navigator.share && navigator.share({
                  title: `Word of the Day: ${word.word}`,
                  text: `${word.word} - ${word.meaning}`,
                  url: window.location.href
                })}
                className="text-sm text-gray-600 hover:text-black transition-colors font-medium"
              >
                Share Article
              </button>
              <button className="text-sm text-gray-600 hover:text-black transition-colors font-medium">
                Print
              </button>
            </div>
            
            <div className="text-xs text-gray-500">
              Published {new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Related Content */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="nyt-section-header">What to Read Next</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="font-medium mb-1">Yesterday's Word</div>
              <div className="text-gray-600">Explore previous vocabulary selections</div>
            </div>
            <div className="p-4 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="font-medium mb-1">Word Archive</div>
              <div className="text-gray-600">Browse our complete collection</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default WordCard;