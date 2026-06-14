import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

export default function Layout({ children, sidebar = true }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {sidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div>{children}</div>
            <Sidebar />
          </div>
        ) : (
          children
        )}
      </main>
      <Footer />
    </div>
  );
}
