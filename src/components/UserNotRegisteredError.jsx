export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold text-foreground">Usuário não cadastrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua conta ainda não está habilitada para acessar este dashboard.
        </p>
      </div>
    </div>
  );
}
