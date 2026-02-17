/*
 * ErrorBoundary.tsx
 * 
 * Este archivo define un componente ErrorBoundary reutilizable para aplicaciones React.
 * Su función es capturar errores en la renderización de sus hijos y mostrar una UI alternativa
 * de error para mejorar la robustez y experiencia de usuario.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Componente UI opcional a mostrar en caso de error
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/*
 * Componente de clase que actúa como boundary de errores.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /*
   * React lifecycle - actualiza estado cuando ocurre un error en cualquier hijo.
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /*
   * React lifecycle - permite registrar detalles adicionales de errores, como logs.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Se puede integrar un sistema de logging externo aquí si es necesario
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Si se provee un UI de fallback personalizado vía props, lo muestra
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI por defecto mostrada en caso de error no interceptado
      return (
        <div className="min-h-screen bg-ritual-black flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={24} />
              <h2 className="text-xl font-bold text-white">Algo salió mal</h2>
            </div>
            <p className="text-zinc-400 mb-4">
              {this.state.error?.message || "Ha ocurrido un error inesperado"}
            </p>
            <button
              onClick={() => {
                // Intenta recuperar el estado limpiando y recargando la página
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full bg-ritual-accent text-black font-bold py-2 px-4 rounded-lg hover:bg-emerald-400 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    // Renderiza los componentes hijos si no hay error
    return this.props.children;
  }
}
