import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  erro: Error | null;
}

// Captura erros de renderização que derrubariam a tela inteira.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Erro não tratado na interface:', erro, info.componentStack);
  }

  render() {
    const { erro } = this.state;
    if (erro) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
          <div className="card max-w-md !p-8">
            <h1 className="text-xl font-bold text-gray-900">
              Algo deu errado
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Esta tela encontrou um erro inesperado. Tente de novo; se o
              problema continuar, recarregue a página.
            </p>
            <code className="mt-4 block break-words rounded-lg bg-red-50 p-3 text-left text-xs text-red-600">
              {erro.message}
            </code>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => this.setState({ erro: null })}
                className="btn-primary"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.assign('/')}
                className="btn-secondary"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
