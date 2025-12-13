import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: Add confetti or celebration animation here
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-2 border-black bg-white p-8 md:p-12 text-center">
        <div className="mb-6">
          <CheckCircle2 className="w-20 h-20 mx-auto mb-4 text-green-500" />
          <Sparkles className="w-8 h-8 mx-auto text-yellow-400" />
        </div>

        <h1 className="font-heavy text-3xl mb-4">
          ★ welcome to the archive! ★
        </h1>

        <p className="font-mono text-sm text-gray-600 mb-8 max-w-md mx-auto">
          your subscription is now active. you have full access to all drum breaks, 
          videos, and discussions. thank you for supporting glitter party archive!
        </p>

        <div className="bg-yellow-50 border-2 border-yellow-400 p-6 mb-8">
          <h2 className="font-heavy text-lg mb-3">what's next?</h2>
          <ul className="font-mono text-xs space-y-2 text-left max-w-md mx-auto">
            <li>★ explore the full break library</li>
            <li>★ watch exclusive video content</li>
            <li>★ join the community discussion</li>
            <li>★ check back weekly for new additions</li>
          </ul>
        </div>

        <Button
          onClick={() => navigate(createPageUrl('Library'))}
          className="bg-black text-white border-2 border-black rounded-none font-heavy text-lg px-10 py-6 hover:bg-gray-800 mb-4"
        >
          ★ enter archive ★
        </Button>

        <p className="font-mono text-xs text-gray-500">
          a confirmation email has been sent to your inbox
        </p>
      </div>
    </div>
  );
}