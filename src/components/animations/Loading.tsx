/**
 * Loading.tsx
 * Componente de animación de carga circular 3D para representar estados de carga.
 */

import "./Loading.css";

export default function Loading() {
  return (
    <div className="loader">
      <div className="inner one"></div>
      <div className="inner two"></div>
      <div className="inner three"></div>
    </div>
  );
}
