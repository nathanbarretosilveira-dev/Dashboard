import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">A rota informada não existe.</p>
        <Link className="inline-flex mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm" to="/">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
