import Link from "next/link";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-4">Facturación</h2>
      <nav>
        <ul>
          <li>
            <Link href="/pages/dashboard">📊 Dashboard</Link>
          </li>
          <li>
            <Link href="/pages/dashboard/invoices">📄 Facturas</Link>
          </li>
          <li>
            <Link href="/pages/dashboard/clients">👤 Clientes</Link>
          </li>
          <li>
            <Link href="/pages/dashboard/settings">⚙️ Configuración</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
