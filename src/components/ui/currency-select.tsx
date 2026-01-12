import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencies, Currency } from "@/lib/currencies";
import { Label } from "@/components/ui/label";

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function CurrencySelect({
  value,
  onValueChange,
  label,
  className,
  disabled,
}: CurrencySelectProps) {
  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <span className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{currency.symbol}</span>
                <span>{currency.code}</span>
                <span className="text-muted-foreground text-xs">- {currency.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  className?: string;
  showCode?: boolean;
}

export function CurrencyDisplay({ 
  amount, 
  currency, 
  className,
  showCode = false 
}: CurrencyDisplayProps) {
  const curr = currencies.find(c => c.code === currency) || currencies[0];
  
  const formatted = new Intl.NumberFormat(curr.locale, {
    style: 'currency',
    currency: curr.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return (
    <span className={className}>
      {formatted}
      {showCode && <span className="text-muted-foreground ml-1 text-xs">{currency}</span>}
    </span>
  );
}
