import { useCredits } from './useCredits';
import { useToast } from './use-toast';

export function useCreditCheck() {
  const { data: credits } = useCredits();
  const { toast } = useToast();

  const checkEmailCredits = (count: number = 1): boolean => {
    if (!credits) {
      toast({
        title: "Unable to verify credits",
        description: "Please try again later.",
        variant: "destructive",
      });
      return false;
    }

    if (credits.credits.email.remaining < count) {
      toast({
        title: "Insufficient email credits",
        description: `You need ${count} email credit${count > 1 ? 's' : ''} but only have ${credits.credits.email.remaining} remaining. Upgrade your plan for more credits.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const checkSmsCredits = (count: number = 1): boolean => {
    if (!credits) {
      toast({
        title: "Unable to verify credits",
        description: "Please try again later.",
        variant: "destructive",
      });
      return false;
    }

    if (credits.credits.sms.remaining < count) {
      toast({
        title: "Insufficient SMS credits",
        description: `You need ${count} SMS credit${count > 1 ? 's' : ''} but only have ${credits.credits.sms.remaining} remaining. Upgrade your plan for more credits.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return {
    credits,
    checkEmailCredits,
    checkSmsCredits,
    emailRemaining: credits?.credits.email.remaining ?? 0,
    smsRemaining: credits?.credits.sms.remaining ?? 0,
  };
}
