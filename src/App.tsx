import { Mic, MicOff, Loader2, History, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveSession } from './lib/useLiveSession';

export default function App() {
  const { state, toggle } = useLiveSession();

  const getStatusText = () => {
    switch (state) {
      case 'disconnected': return 'Disconnected';
      case 'connecting': return 'Connecting...';
      case 'listening': return 'Listening...';
      case 'speaking': return 'Speaking...';
    }
  };

  const getVoiceQuote = () => {
    switch (state) {
      case 'disconnected': return '"Tap the mic to wake me up, darling."';
      case 'connecting': return '"Wait, neural link connect kar rahi hoon..."';
      case 'listening': return '"Bolo, I\'m listening. Try to keep up."';
      case 'speaking': return '"Suno meri baat..."';
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#F5F5F5] font-sans flex flex-col items-center justify-between p-4 sm:p-12 overflow-hidden border-4 border-[#1A1A1A]">
      <header className="w-full flex justify-between items-start pt-4 px-4 sm:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-light tracking-widest text-[#FF3366] uppercase">Zoya</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              state === 'disconnected' ? 'bg-[#FF3366]' : 
              state === 'connecting' ? 'bg-yellow-500' : 
              'bg-[#00FF41]'
            }`}></span>
            <span className="text-[10px] uppercase tracking-tighter opacity-50 font-mono">Gemini-3.1-Flash-Live</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 opacity-40 font-mono text-[10px] uppercase">
          <p>Latency: ~142ms</p>
          <p>Uptime: Active</p>
          <p>Signal: Encrypted</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative w-full mt-4 mb-4">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] sm:w-[384px] h-[300px] sm:h-[384px] rounded-full border border-[#FF3366] opacity-10"></div>
          <div className="w-[380px] sm:w-[480px] h-[380px] sm:h-[480px] rounded-full border border-[#FF3366] opacity-5"></div>
        </div>
        <div className="relative flex flex-col items-center">
          <div className={`w-48 sm:w-64 h-48 sm:h-64 rounded-full flex items-center justify-center transition-all duration-700 ease-in-out border-8 border-black ${
            state === 'speaking' || state === 'listening' 
              ? 'bg-[#FF3366] shadow-[0_0_100px_rgba(255,51,102,0.4)]' 
              : 'bg-[#1A1A1A]'
          }`}>
            <div className="flex gap-1 items-center justify-center h-full">
               {state === 'speaking' ? (
                 <AnimatePresence>
                   <motion.div
                     key="speaking-wave-1"
                     animate={{ height: ['40px', '80px', '40px'] }}
                     transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                   <motion.div
                     key="speaking-wave-2"
                     animate={{ height: ['60px', '120px', '60px'] }}
                     transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                   <motion.div
                     key="speaking-wave-3"
                     animate={{ height: ['80px', '160px', '80px'] }}
                     transition={{ repeat: Infinity, duration: 0.4, ease: "linear" }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                   <motion.div
                     key="speaking-wave-4"
                     animate={{ height: ['60px', '120px', '60px'] }}
                     transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                   <motion.div
                     key="speaking-wave-5"
                     animate={{ height: ['40px', '80px', '40px'] }}
                     transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                 </AnimatePresence>
               ) : state === 'listening' ? (
                 <AnimatePresence>
                   <motion.div
                     animate={{ height: ['40px', '60px', '40px'] }}
                     transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0 }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                   <motion.div
                     animate={{ height: ['60px', '96px', '60px'] }}
                     transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.2 }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                   <motion.div
                     animate={{ height: ['80px', '128px', '80px'] }}
                     transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.4 }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                   <motion.div
                     animate={{ height: ['60px', '96px', '60px'] }}
                     transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.6 }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                   <motion.div
                     animate={{ height: ['40px', '60px', '40px'] }}
                     transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.8 }}
                     className="w-2 bg-black/40 rounded-full"
                   />
                 </AnimatePresence>
               ) : (
                 <div className="text-white/20"><MicOff size={48} /></div>
               )}
            </div>
          </div>
          
          <div className="mt-8 sm:mt-12 flex flex-col items-center gap-4 text-center max-w-sm px-4">
            <p className="text-lg sm:text-xl italic font-serif text-[#FF3366] tracking-wide">
              {getVoiceQuote()}
            </p>
            <p className="text-xs sm:text-sm uppercase tracking-[0.4em] opacity-40">
              {getStatusText()}
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full flex flex-col items-center gap-8 sm:gap-12 pb-4 sm:pb-8">
        <div className="flex gap-12 sm:gap-24 items-center">
          <button className="group flex flex-col items-center gap-3 opacity-30 hover:opacity-100 transition-opacity">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
              <History size={18} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] uppercase tracking-widest hidden sm:block">History</span>
          </button>
          
          <button onClick={toggle} className="relative group focus:outline-none">
            <div className={`w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-[#1A1A1A] border-2 flex items-center justify-center shadow-2xl transition-all ${
              state !== 'disconnected' ? 'border-[#FF3366]' : 'border-white/10 group-hover:border-[#FF3366]'
            }`}>
              {state === 'disconnected' ? (
                <MicOff className="w-6 sm:w-8 h-6 sm:h-8 text-white transition-colors group-hover:text-[#FF3366]" />
              ) : state === 'connecting' ? (
                <Loader2 className="w-6 sm:w-8 h-6 sm:h-8 text-[#FF3366] animate-spin" />
              ) : (
                <Mic className="w-6 sm:w-8 h-6 sm:h-8 text-[#FF3366]" />
              )}
            </div>
            {state !== 'disconnected' && (
              <div className="absolute -top-1 -right-1 w-3 sm:w-4 h-3 sm:h-4 bg-[#FF3366] rounded-full ring-4 ring-black"></div>
            )}
          </button>
          
          <button className="group flex flex-col items-center gap-3 opacity-30 hover:opacity-100 transition-opacity">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
              <Wrench size={18} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] uppercase tracking-widest hidden sm:block">Tools</span>
          </button>
        </div>
        <div className="w-2/3 sm:w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#FF3366] to-transparent opacity-20"></div>
      </footer>
    </div>
  );
}
