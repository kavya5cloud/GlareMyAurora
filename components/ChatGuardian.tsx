import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatGuardian: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Greetings, Earthling! 🖖 I am GlareMyAurora. Ask me about solar storms, survival gear, or the science of the lights!', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const responseText = result.text;
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
         id: (Date.now() + 1).toString(),
         role: 'model',
         text: "Comm link disrupted! Static in the atmosphere... try again.",
         timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
      <div className="flex-1 overflow-y-auto space-y-6 p-4 mb-4 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'model' && (
                <div className="w-8 h-8 mr-2 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center border border-white/30 text-sm flex-shrink-0 self-end mb-2">
                  🤖
                </div>
             )}
            <div className={`max-w-[85%] relative p-5 text-lg shadow-md ${
              msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-[2rem] rounded-br-none mr-2' 
                : 'bg-slate-800 text-slate-100 rounded-[2rem] rounded-bl-none border-2 border-slate-700 ml-1'
            }`}>
              <p className="whitespace-pre-wrap leading-snug">{msg.text}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 ml-2 rounded-full bg-teal-600 flex items-center justify-center border border-white/30 text-sm flex-shrink-0 self-end mb-2">
                🧑‍🚀
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-center">
             <div className="w-8 h-8 mr-2 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center border border-white/30 text-sm">🤖</div>
             <div className="bg-slate-800 rounded-[2rem] rounded-bl-none p-4 border-2 border-slate-700 flex gap-2 items-center">
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="relative mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message to space command..."
          className="w-full bg-slate-800/80 backdrop-blur-md border-2 border-slate-600 rounded-full py-5 pl-6 pr-16 text-white text-lg placeholder-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20 focus:outline-none transition-all shadow-lg"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-3 top-3 p-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 rounded-full text-slate-900 transition-colors shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatGuardian;