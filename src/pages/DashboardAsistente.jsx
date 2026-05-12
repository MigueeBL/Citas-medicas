export default function DashboardAsistente({ user }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-pink-600">Panel Asistente</h1>
      <p className="text-gray-600 mt-1">Bienvenido, {user?.nombre}</p>
    </div>
  );
}