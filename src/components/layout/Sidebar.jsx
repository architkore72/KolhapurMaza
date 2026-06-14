import { Link } from 'react-router-dom';
import { useLatestNews, usePopularNews } from '../../hooks/useNews';
import { useCategories } from '../../hooks/useCategories';
import { ListCard, SkeletonListCard } from '../ui/NewsCard';
import NewsletterWidget from '../ui/NewsletterWidget';
import AdBanner from '../ui/AdBanner';

function SidebarSection({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 className="section-title text-base">{title}</h3>
      {children}
    </div>
  );
}

export default function Sidebar() {
  const { data: latest = [], isLoading: latestLoading } = useLatestNews(5);
  const { data: popular = [], isLoading: popularLoading } = usePopularNews(5);
  const { data: categories = [] } = useCategories();

  return (
    <aside className="space-y-5">
      {/* Ad banner */}
      <AdBanner position="sidebar" />

      {/* Popular News */}
      <SidebarSection title="Popular News">
        <div className="space-y-1">
          {popularLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonListCard key={i} />)
            : popular.map(item => <ListCard key={item.id} news={item} />)
          }
        </div>
      </SidebarSection>

      {/* Latest News */}
      <SidebarSection title="Latest News">
        <div className="space-y-1">
          {latestLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonListCard key={i} />)
            : latest.map(item => <ListCard key={item.id} news={item} />)
          }
        </div>
      </SidebarSection>

      {/* Categories */}
      <SidebarSection title="Categories">
        <ul className="space-y-1">
          {categories.map(cat => (
            <li key={cat.id}>
              <Link
                to={`/category/${cat.slug}`}
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 transition-colors group"
              >
                <span>›&nbsp;{cat.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </SidebarSection>

      {/* Newsletter */}
      <NewsletterWidget />
    </aside>
  );
}
