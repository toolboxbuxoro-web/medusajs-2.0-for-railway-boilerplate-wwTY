import { Text } from 'react-native';

interface InstallmentPriceProps {
  amount: number;
  months?: number;
}

export function InstallmentPrice({ amount, months = 12 }: InstallmentPriceProps) {
  const monthlyPrice = Math.floor(amount / months);
  
  const formatPrice = (price: number): string => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  return (
    <Text className="text-gray-500 text-[10px] leading-tight">
      от {formatPrice(monthlyPrice)} сум/мес
    </Text>
  );
}
