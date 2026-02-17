/**
 * ShopGrid.tsx
 *
 * Este archivo define el componente ShopGrid, que muestra una cuadrícula de artículos disponibles en la tienda.
 * Utiliza el estado global del usuario para mostrar si puede pagar o comprar cada ítem.
 */

import { ShopCard } from "../ShopCard";
import { useUserStore } from "../../store/userStore";

// Componente que muestra una cuadrícula de tarjetas de la tienda
export const ShopGrid = ({ items }) => {
  const { buyItem, userEssence } = useUserStore(); // Obtiene funciones y datos del usuario actual

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => (
        <ShopCard
          key={item.id}
          item={item}
          onBuy={() => buyItem(item)} // Callback para comprar el item
          canAfford={userEssence >= item.cost} // Indica si el usuario puede comprarlo
        />
      ))}
    </div>
  );
};
