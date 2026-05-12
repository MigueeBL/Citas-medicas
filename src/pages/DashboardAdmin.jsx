export default function DashboardAdmin({ user }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-amber-600">Panel Administrador</h1>
      <p className="text-gray-600 mt-1">Bienvenido, {user?.nombre}</p>
    </div>
  );
}