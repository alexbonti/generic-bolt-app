import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Newspaper, ChevronRight } from 'lucide-react';
import type { Database } from '../types/supabase';

type NewsArticle = Database['public']['Tables']['news']['Row'];

export default function NewsList() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNews(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600">Loading news...</div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">News Management</h1>
        <Link
          to="/admin/news/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Article
        </Link>
      </div>

      <div className="grid gap-6">
        {news.map((article) => (
          <Link
            key={article.id}
            to={`/admin/news/${article.id}`}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Newspaper className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{article.title}</h2>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(article.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-600 line-clamp-2">{article.content}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </Link>
        ))}
        {news.length === 0 && (
          <div className="text-center text-gray-600 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            No articles published yet.
          </div>
        )}
      </div>
    </div>
  );
}