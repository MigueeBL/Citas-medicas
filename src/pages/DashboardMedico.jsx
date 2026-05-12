export default function DashboardMedico({ user }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-indigo-700">Panel Médico</h1>
      <p className="text-gray-600 mt-1">Bienvenido, {user?.nombre}</p>
    </div>
  );
}