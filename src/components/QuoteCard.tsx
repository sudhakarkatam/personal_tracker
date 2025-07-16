
import { useState } from 'react';
import { RefreshCw, Share, Copy } from 'lucide-react';
import { quotes } from '@/data/quotes';
import { useToast } from '@/hooks/use-toast';

export function QuoteCard() {
  const { toast } = useToast();
  const [currentQuote, setCurrentQuote] = useState(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('dailyQuote');
    const savedData = saved ? JSON.parse(saved) : null;
    
    if (savedData && savedData.date === today) {
      return quotes.find(q => q.id === savedData.quoteId) || quotes[0];
    }
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    localStorage.setItem('dailyQuote', JSON.stringify({
      date: today,
      quoteId: randomQuote.id
    }));
    return randomQuote;
  });

  const refreshQuote = () => {
    const newQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(newQuote);
    const today = new Date().toDateString();
    localStorage.setItem('dailyQuote', JSON.stringify({
      date: today,
      quoteId: newQuote.id
    }));
  };

  const copyQuote = async () => {
    try {
      await navigator.clipboard.writeText(`"${currentQuote.text}" - ${currentQuote.author}`);
      toast({
        title: "Quote copied!",
        description: "The quote has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy the quote to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareQuote = async () => {
    const text = `"${currentQuote.text}" - ${currentQuote.author}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Daily Inspiration',
          text: text,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyQuote();
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          📖 Daily Inspiration
        </h3>
        <button
          onClick={refreshQuote}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="New Quote"
        >
          <RefreshCw size={16} className="text-gray-600" />
        </button>
      </div>
      
      <blockquote className="text-gray-600 italic text-center mb-4">
        "{currentQuote.text}"
      </blockquote>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">— {currentQuote.author}</p>
        <div className="flex gap-2">
          <button
            onClick={copyQuote}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Copy Quote"
          >
            <Copy size={14} className="text-gray-600" />
          </button>
          <button
            onClick={shareQuote}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Share Quote"
          >
            <Share size={14} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
