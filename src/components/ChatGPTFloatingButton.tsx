import React from 'react';
import { MessageCircle } from 'lucide-react';

const CHATGPT_URL = 'https://chat.openai.com/';

export const ChatGPTFloatingButton: React.FC<{ className?: string }> = ({ className }) => {
  const openInNewTab = () => {
    window.open(CHATGPT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={openInNewTab}
      aria-label="Chat with ChatGPT"
      className={
        `fixed bottom-14 right-6 z-[999] flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-black/20 bg-primary-500 text-white hover:bg-primary-600 transition-colors ${
          className || ''
        }`
      }
    >
      <MessageCircle size={22} />
    </button>
  );
};

export default ChatGPTFloatingButton;

