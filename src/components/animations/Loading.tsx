import "./Loading.css";

// Componente de animación de carga circular 3D (loader)
// Utiliza tres "rings" internos para el efecto visual animado
export default function Loading() {
  return (
    <div className="loader">
      {/* Ring 1: rota y muestra borde inferior */}
      <div className="inner one"></div>
      {/* Ring 2: rota y muestra borde derecho */}
      <div className="inner two"></div>
      {/* Ring 3: rota y muestra borde superior */}
      <div className="inner three"></div>
    </div>
  );
}
