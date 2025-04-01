import { useEffect, useState } from "react";
import { BookOpen, Sparkles, CheckCircle, Book, GraduationCap, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState([
    "Loading academic resources...",
    "Preparing your dashboard...",
    "Syncing assignments...",
    "Gathering course materials...",
    "Welcome!"
  ]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 700); // Slightly longer delay for better UX
          return 100;
        }
        // Update loading message based on progress
        if (prev % 20 === 0 && prev > 0) {
          setCurrentMessageIndex(Math.min(prev / 20, loadingMessages.length - 1));
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete, loadingMessages.length]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 text-white overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="absolute inset-0 opacity-20"
        initial={{ backgroundPosition: "0% 0%" }}
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%"], 
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
        style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\" fill=\"%23ffffff\" fill-opacity=\"0.1\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="flex flex-col items-center justify-center space-y-8 px-6 text-center z-10">
        <motion.div 
          className="flex items-center gap-3 mb-2"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="bg-blue-700 rounded-full p-2"
          >
            <GraduationCap className="h-10 w-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-100">
            SDS Year 2 Group B
          </h1>
          
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "mirror"
            }}
          >
            <Sparkles className="h-8 w-8 text-amber-300" />
          </motion.div>
        </motion.div>
        
        <motion.div
          className="flex items-center space-x-8 mt-2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {[Book, CheckCircle, Award].map((Icon, i) => (
            <motion.div 
              key={i}
              className="rounded-full bg-white/10 p-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + (i * 0.2) }}
              whileHover={{ y: -5, scale: 1.1 }}
            >
              <Icon className="h-5 w-5 text-blue-200" />
            </motion.div>
          ))}
        </motion.div>
        
        <motion.p 
          className="text-xl text-blue-100 max-w-md font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Your comprehensive academic management portal
        </motion.p>
        
        <motion.div 
          className="w-full max-w-md h-3 bg-blue-950/60 rounded-full overflow-hidden backdrop-blur-sm border border-blue-800/30"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%"],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
          />
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.p 
            key={currentMessageIndex}
            className="text-sm text-blue-200 h-6 flex items-center justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {loadingMessages[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
        
        <motion.div 
          className="absolute bottom-4 right-4 flex items-center text-xs text-blue-300/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <span className="font-serif italic">Built by</span>
          <span className="ml-1 font-bold">𝐌𝐚𝐯𝐞𝐫𝐢𝐜𝐤</span>
        </motion.div>
      </div>
    </motion.div>
  );
}