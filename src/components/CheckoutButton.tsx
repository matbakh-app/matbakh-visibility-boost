
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  packageCode: string;
  packageName: string;
  price: number;
  disabled?: boolean;
  className?: string;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  packageCode,
  packageName,
  price,
  disabled = false,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Bitte melden Sie sich an, um fortzufahren');
        return;
      }

      console.log('Creating checkout session for:', { packageCode, packageName, price });

      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Keine gültige Sitzung gefunden');
        return;
      }

      // Call create-checkout edge function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          packageCode,
          returnUrl: window.location.origin
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Fehler beim Erstellen der Checkout-Sitzung');
        return;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe Checkout:', data.url);
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
      } else {
        toast.error('Keine Checkout-URL erhalten');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={`w-full ${className}`}
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Wird geladen...
        </>
      ) : (
        `${packageName} kaufen - €${price}`
      )}
    </Button>
  );
};

export default CheckoutButton;
