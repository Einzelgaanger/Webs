import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type BadgeProps = {
  text: string;
  color: "red" | "amber" | "blue" | "green" | "purple" | "gray";
};

type StatCardProps = {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: "blue" | "green" | "purple" | "amber";
  badges?: BadgeProps[];
};

// Counter animation component for numeric values
function AnimatedCounter({ value, color }: { value: number, color: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Start from a small value to animate up
    setCount(0);
    
    // Animate to the target value over time
    const duration = 1500; // ms
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    
    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentCount = Math.floor(easeOutCubic(progress) * value);
      
      if (progress >= 1) {
        setCount(value);
        clearInterval(counter);
      } else {
        setCount(currentCount);
      }
    }, frameDuration);
    
    return () => clearInterval(counter);
  }, [value]);
  
  // Easing function for smoother animation
  function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
  }
  
  return <span className={color}>{count}</span>;
}

// Format value for display
function formatValue(val: number | string): JSX.Element | string {
  if (typeof val === 'number') {
    return <AnimatedCounter value={val} color="" />;
  } else if (typeof val === 'string' && val.startsWith('#') && !isNaN(parseInt(val.substring(1)))) {
    // Handle rank display like "#1"
    const numericPart = parseInt(val.substring(1));
    return <>
      #<AnimatedCounter value={numericPart} color="" />
    </>;
  }
  return val;
}

export default function StatCard({ title, value, icon, color, badges }: StatCardProps) {
  // Color mapping
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      text: "text-primary",
      border: "border-blue-100",
      hover: "hover:bg-blue-100"
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-500",
      border: "border-green-100",
      hover: "hover:bg-green-100"
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-500",
      border: "border-purple-100",
      hover: "hover:bg-purple-100"
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-500",
      border: "border-amber-100",
      hover: "hover:bg-amber-100"
    }
  };

  // Badge color mapping
  const badgeColorMap = {
    red: "bg-red-50 text-red-500",
    amber: "bg-amber-50 text-amber-500",
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-500",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-100 text-gray-700"
  };

  const selectedColor = colorMap[color];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 * ["blue", "green", "purple", "amber"].indexOf(color) }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      className={`bg-white rounded-xl shadow-sm p-5 border ${selectedColor.border} cursor-pointer ${selectedColor.hover} transition-all`}
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-gray-500"
          >
            {title}
          </motion.p>
          <motion.h3 
            className={`text-2xl font-bold ${selectedColor.text}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {formatValue(value)}
          </motion.h3>
        </div>
        <motion.div 
          className={`h-12 w-12 rounded-full ${selectedColor.bg} flex items-center justify-center`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
          whileHover={{ 
            rotate: 5,
            scale: 1.1,
            transition: { duration: 0.2 }
          }}
        >
          {icon}
        </motion.div>
      </div>
      
      <AnimatePresence>
        {badges && badges.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-3 flex items-center space-x-2"
          >
            {badges.map((badge, index) => (
              <motion.span 
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + (index * 0.1) }}
                whileHover={{ scale: 1.1 }}
                className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColorMap[badge.color]}`}
              >
                {badge.text}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
