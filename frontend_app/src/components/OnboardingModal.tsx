"use client";

import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Rocket, CheckCircle2 } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal Content */}
      <div className={`relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="absolute right-4 top-4">
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-600 p-3 shadow-lg shadow-blue-200">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">Welcome to WordsGo!</h2>
              <p className="text-blue-600 font-medium text-lg">Your journey to language mastery begins here.</p>
            </div>
          </div>

          <div className="mb-10 rounded-2xl bg-blue-50/50 border border-blue-100 p-6">
            <h3 className="mb-4 flex items-center text-xl font-bold text-blue-900">
              <Lightbulb className="mr-3 h-6 w-6 text-yellow-500" />
              Best Practice for Success
            </h3>
            <p className="mb-6 text-gray-700 leading-relaxed text-lg font-medium">
              To get the most out of WordsGo, we recommend this simple strategy:
            </p>
            
            <div className="grid gap-6">
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-md">1</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Focus on a Topic</h4>
                  <p className="text-gray-600">Add about <strong>100 words</strong> related to a single topic (e.g., Business or Travel) to build strong context.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-md">2</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Daily Reviews</h4>
                  <p className="text-gray-600">Master these words through <strong>daily repetition</strong> until they feel natural and familiar.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-md">3</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">AI Practice</h4>
                  <p className="text-gray-600">Switch to <strong>AI Practice</strong> to use your new vocabulary in full sentences and real-world situations.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-xl font-bold text-white shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <CheckCircle2 className="h-6 w-6" />
            Got it, let's start!
          </button>
        </div>
      </div>
    </div>
  );
}
