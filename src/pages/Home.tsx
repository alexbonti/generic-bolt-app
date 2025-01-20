import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MessageSquare, Heart, Share2, User, Youtube, Video } from 'lucide-react';
import type { Database } from '../types/supabase';

function getYoutubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&\?]{10,12})/);
  return match && match[1];
}

type NewsArticle = Database['public']['Tables']['news']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface NewsWithAuthor extends NewsArticle {
  profiles: Profile;
}

interface ExpandedArticles {
  [key: string]: boolean;
}

export default function Home() {
  const [news, setNews] = useState<NewsWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedArticles, setExpandedArticles] = useState<ExpandedArticles>({});

  useEffect(() => {
    async function fetchNews() {
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          profiles:author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNews(data);
      }
      setLoading(false);
    }

    fetchNews();
  }, []);

  const toggleArticle = (id: string) => {
    setExpandedArticles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600">Loading news...</div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Latest News</h1>
      <div className="space-y-6">
        {news.map((article) => {
          const isExpanded = expandedArticles[article.id];
          const author = article.profiles;
          const authorName = author?.full_name || 'Anonymous';
          const contentPreview = article.content.slice(0, 280);
          const hasMoreContent = article.content.length > 280;

          return (
            <article key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4">
                <Link
                  to={`/profile/${author?.id}`}
                  className="flex items-center mb-3 group"
                >
                  {author?.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt={authorName}
                      className="h-12 w-12 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold border border-gray-200">
                      <User size={24} />
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="font-semibold group-hover:text-blue-600 transition-colors">
                      {authorName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(article.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </Link>

                {/* Title */}
                <h2 className="text-xl font-semibold mb-2">{article.title}</h2>

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600">
                    {isExpanded ? article.content : contentPreview}
                    {hasMoreContent && !isExpanded && '...'}
                  </p>
                  {hasMoreContent && (
                    <button
                      onClick={() => toggleArticle(article.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                {/* Image */}
                {article.image_url && (
                  <div className="mt-4">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full rounded-lg object-cover max-h-96"
                    />
                  </div>
                )}

                {/* Video Content */}
                {article.video_type === 'youtube' && article.video_url && (
                  <div className="mt-4">
                    <iframe
                      width="100%"
                      height="315"
                      src={`https://www.youtube.com/embed/${getYoutubeId(article.video_url)}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg"
                    />
                  </div>
                )}
                {article.video_type === 'upload' && article.video_file_url && (
                  <div className="mt-4">
                    <video controls className="w-full rounded-lg">
                      <source src={article.video_file_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Engagement buttons */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                    <Heart size={20} />
                    <span className="text-sm">Like</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                    <MessageSquare size={20} />
                    <span className="text-sm">Comment</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                    <Share2 size={20} />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {news.length === 0 && (
          <div className="text-center text-gray-600 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            No news articles available.
          </div>
        )}
      </div>
    </div>
  );
}
