"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function OtpInput({ length = 6, value = "", onChange }) {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);

  // Keep local state in sync with external value changes (e.g. resets)
  useEffect(() => {
    const otpArray = value.split("").slice(0, length);
    const newOtp = [...Array(length).fill("")];
    otpArray.forEach((char, idx) => {
      newOtp[idx] = char;
    });
    setOtp(newOtp);
  }, [value, length]);

  // Auto focus the first box on initial mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element, index) => {
    const val = element.value.replace(/\D/g, ""); // Allow digits only
    if (!val) {
      // Handle backspacing or empty box state
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      onChange(newOtp.join(""));
      return;
    }

    // Take the last entered character (in case of double input)
    const char = val.substring(val.length - 1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    onChange(newOtp.join(""));

    // Auto-focus next input box if available
    if (index < length - 1 && char) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      // If current field is empty, clear the previous field and focus it
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        onChange(newOtp.join(""));
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, idx) => {
      newOtp[idx] = char;
    });
    setOtp(newOtp);
    onChange(newOtp.join(""));

    // Focus on the next empty field or the last field
    const focusIndex = Math.min(pastedData.length, length - 1);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }
  };

  return (
    <div className="flex justify-center items-center gap-1.5 sm:gap-2.5 w-full my-2" onPaste={handlePaste}>
      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          value={digit}
          ref={(el) => (inputRefs.current[index] = el)}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={cn(
            "w-9 h-9 sm:w-12 sm:h-12 text-center text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl border-2 transition-all duration-200 outline-none select-all",
            "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100",
            "focus:border-primary dark:focus:border-primary-foreground focus:ring-4 focus:ring-primary/10 dark:focus:ring-primary-foreground/10 focus:scale-[1.05]",
            digit ? "border-primary/50 dark:border-primary/50 bg-white dark:bg-slate-950 font-black" : ""
          )}
        />
      ))}
    </div>
  );
}
