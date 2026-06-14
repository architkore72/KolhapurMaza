import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaYoutube, FaInstagram } from 'react-icons/fa';
import { useCategories } from '../../hooks/useCategories';

export default function Footer() {
  const { data: categories = [] } = useCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-700 rounded flex items-center justify-center">
                <span className="text-white font-black text-lg">K</span>
              </div>
              <span className="text-white font-black text-lg">KopMaza News</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted source for the latest news across politics, business, technology, sports, and more.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-blue-400 transition-colors"><FaFacebook size={18} /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-400 hover:text-sky-400 transition-colors"><FaTwitter size={18} /></a>
              <a href="https://www.youtube.com/@KOPMAZA" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-red-500 transition-colors"><FaYoutube size={18} /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-pink-400 transition-colors"><FaInstagram size={18} /></a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider border-b border-gray-700 pb-2">Categories</h4>
            <ul className="space-y-1.5">
              {categories.slice(0, 8).map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`} className="text-sm text-gray-400 hover:text-red-400 transition-colors">
                    › {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider border-b border-gray-700 pb-2">Quick Links</h4>
            <ul className="space-y-1.5">
              {[
                { label: 'Home', path: '/' },
                { label: 'Latest News', path: '/search?q=' },
                { label: 'Contact Us', path: '/contact' },
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-gray-400 hover:text-red-400 transition-colors">
                    › {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider border-b border-gray-700 pb-2">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 news@kopmaza.in</li>
              <li>📞 +91 9595329596</li>
              <li>📍 Kolhapur, Maharashtra, India</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4">
        <div className="container mx-auto px-4 text-center text-xs text-gray-500">
          © {year} KopMaza News. All rights reserved. Built with React & Supabase.
        </div>
      </div>
    </footer>
  );
}
