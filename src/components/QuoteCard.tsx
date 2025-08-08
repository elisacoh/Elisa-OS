import React from 'react';
import { Sparkles } from 'lucide-react';

const quotes = [
  "La beauté commence au moment où tu décides d'être toi-même.",
  "Chaque petit pas compte, même ceux que personne ne voit.",
  "Tu es plus forte que tu ne le penses et plus belle que tu ne l'imagines.",
  "L'élégance, c'est quand l'intérieur est aussi beau que l'extérieur.",
  "Prends soin de toi comme tu prendrais soin de ce que tu aimes le plus."
];

export default function QuoteCard() {
  const todayQuote = quotes[new Date().getDay() % quotes.length];
  
  return (
    <div className="relative bg-gradient-to-br from-primary-50 to-rose-50 rounded-2xl p-6 overflow-hidden">
      <div className="absolute top-4 right-4 text-primary-300">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="relative z-10">
        <p className="text-lg font-light text-neutral-700 leading-relaxed font-display italic">
          "{todayQuote}"
        </p>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-primary-400 to-rose-400 rounded-full"></div>
          <span className="text-sm text-neutral-500 font-medium">Citation du jour</span>
        </div>
      </div>
    </div>
  );
}