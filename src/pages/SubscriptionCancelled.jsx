import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function SubscriptionCancelledPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-2 border-black bg-white p-8 md:p-12 text-center">
        <XCircle className="w-16 h-16 mx-auto mb-6 text-gray-400" />

        <h1 className="font-heavy text-2xl mb-4">
          subscription cancelled
        </h1>

        <p className="font-mono text-sm text-gray-600 mb-8 max-w-md mx-auto">
          you cancelled the checkout process. no charges were made to your account.
          you can try again whenever you&apos;re ready.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate(createPageUrl('Subscribe'))}
            className="bg-black text-white border-2 border-black rounded-none font-heavy text-sm px-8 py-4 hover:bg-gray-800"
          >
            try again
          </Button>
          
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="outline"
            className="border-2 border-black rounded-none font-heavy text-sm px-8 py-4 hover:bg-gray-100"
          >
            back to home
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-300">
          <p className="font-mono text-xs text-gray-600 mb-4">
            still want limited access? you can try the free tier:
          </p>
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="font-mono text-xs underline hover:text-gray-600"
          >
            explore free access option
          </button>
        </div>
      </div>
    </div>
  );
}