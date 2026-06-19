import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

export default function Layout({ children, sidebar = true }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        {sidebar ? (
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">{children}</div>
            <aside className="hidden lg:block w-80 shrink-0">
              <Sidebar />
            </aside>
          </div>
        ) : (
          children
        )}
      </main>
      <Footer />
    </div>
  );
}
