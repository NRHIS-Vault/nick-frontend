import React, { useState, useEffect } from 'react';
import { Mic, MicOff, MessageCircle, Minimize2, Maximize2 } from 'lucide-react';

interface NickAvatarProps {
  isFloating?: boolean;
  onToggleChat?: () => void;
}

const NickAvatar: React.FC<NickAvatarProps> = ({ isFloating = false, onToggleChat }) => {
  const [isListening, setIsListening] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const avatarUrl = "https://d64gsuwffb70l.cloudfront.net/68b924f79c49746e335d84b0_1756964131310_4f5ee704.webp";

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (isFloating) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isMinimized ? 'scale-75' : 'scale-100'}`}>
        <div className="relative">
          <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isListening ? 'border-green-400 shadow-lg shadow-green-400/50' : 'border-blue-400 shadow-lg shadow-blue-400/50'} ${isAnimating ? 'animate-pulse' : ''}`}>
            <img src={avatarUrl} alt="Nick Avatar" className="w-full h-full object-cover" />
          </div>
          
          {isListening && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          )}
          
          <div className="absolute -bottom-2 -right-2 flex gap-1">
            <button
              onClick={toggleListening}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} transition-colors`}
            >
              {isListening ? <MicOff size={12} /> : <Mic size={12} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-32 h-32 rounded-full overflow-hidden border-4 ${isListening ? 'border-green-400 shadow-2xl shadow-green-400/50' : 'border-blue-400 shadow-2xl shadow-blue-400/50'} ${isAnimating ? 'animate-pulse' : ''} transition-all duration-300`}>
        <img src={avatarUrl} alt="Nick Avatar" className="w-full h-full object-cover" />
        
        {isListening && (
          <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
            <div className="w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex gap-3">
        <button
          onClick={toggleListening}
          className={`px-4 py-2 rounded-full font-medium transition-all ${isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
      </div>
    </div>
  );
};

export default NickAvatar;