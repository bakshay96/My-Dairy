import React from "react";
import { Milk } from "lucide-react";

export default function MilkifyLoader({ text = "Milkify" }) {
  // Split text into array of characters for individual animation
  const chars = text.split("");

  return (
    <div className="flex h-full w-full items-center justify-center bg-background/80 backdrop-blur-sm fixed inset-0 z-50">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 animate-ping rounded-full border-4 border-primary opacity-20"></div>
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-xl border border-primary/30 backdrop-blur-md">
            <Milk className="h-10 w-10 text-primary animate-bounce" />
          </div>
        </div>
        
        {/* Animated text with bouncing characters */}
        <div className="flex space-x-1">
          {chars.map((char, index) => (
            <span
              key={index}
              className="text-2xl md:text-3xl font-extrabold text-primary tracking-wider uppercase"
              style={{
                animation: `bounce 1s infinite`,
                animationDelay: `${index * 0.1}s`,
                display: "inline-block"
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}} />
    </div>
  );
}
