// src/components/shop/ShopGrid.tsx
import { ShopCard } from './ShopCard';
import { useUserStore } from '../../store/userStore';
 
export const ShopGrid = ({ items }) => {
  const { buyItem, userEssence } = useUserStore(); // Estado global
  return (
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map(item => (
<ShopCard 
          key={item.id} 
          item={item} 
          onBuy={() => buyItem(item)} 
          canAfford={userEssence >= item.cost}
        />
      ))}
</div>
  );
};