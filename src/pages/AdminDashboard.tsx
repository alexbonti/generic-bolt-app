import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Users, Ticket, Newspaper, Mail } from 'lucide-react';
import type { Database } from '../types/supabase';
import NewsList from './NewsList';
import NewsEditor from './NewsEditor';
import EmailManagement from './EmailManagement';
import EmailTemplates from './EmailTemplates';

type NewsArticle = Database['public']['Tables']['news']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Ticket = Database['public']['Tables']['tickets']['Row'];

// Dashboard Overview Component
function DashboardOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    newTickets: 0,
    totalNews: 0
  });
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: usersCount },
        { count: ticketsCount },
        { count: newTicketsCount },
        { count: newsCount },
        { data: recentTicketsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*').eq('status', 'new').limit(5)
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalTickets: ticketsCount || 0,
        newTickets: newTicketsCount || 0,
        totalNews: newsCount || 0
      });

      if (recentTicketsData) {
        setRecentTickets(recentTicketsData);
      }

      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-gray-600">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Tickets"
          value={stats.totalTickets}
          icon={<Ticket className="w-6 h-6" />}
          color="bg-green-500"
        />
        <StatCard
          title="New Tickets"
          value={stats.newTickets}
          icon={<Ticket className="w-6 h-6" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="News Articles"
          value={stats.totalNews}
          icon={<Newspaper className="w-6 h-6" />}
          color="bg-purple-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Tickets</h2>
        <div className="space-y-4">
          {recentTickets.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{ticket.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
          {recentTickets.length === 0 && (
            <p className="text-gray-600 text-center py-4">No new tickets</p>
          )}
        </div>
      </div>
    </div>
  );
}

// User Management Component
function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setUsers(data);
      }
      setLoading(false);
    }

    fetchUsers();
  }, []);

  async function handleRoleChange(userId: string, newRole: 'user' | 'admin') {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading users...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.full_name || 'Unnamed User'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                    className="text-sm border rounded-md px-2 py-1"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// News Management Component
function NewsManagement() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'upload' | null>(null);
  const [videoFileUrl, setVideoFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      setUploading(true);

      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('news-images')
        .upload(fileName, file);

      if (error) throw error;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('news-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }

    try {
      setUploading(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('news-videos')
        .upload(fileName, file);

      if (error) throw error;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('news-videos')
        .getPublicUrl(fileName);

      setVideoFileUrl(publicUrl);
      setVideoType('upload');
      setVideoUrl('');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video');
    } finally {
      setUploading(false);
    }
  }

  function handleYoutubeUrl(url: string) {
    setVideoUrl(url);
    setVideoType('youtube');
    setVideoFileUrl('');
  }

  function clearImage() {
    setImageUrl('');
    setPreviewUrl('');
  }

  function clearVideo() {
    setVideoUrl('');
    setVideoType(null);
    setVideoFileUrl('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('news').insert([
      {
        title,
        content,
        image_url: imageUrl,
        video_url: videoUrl,
        video_type: videoType,
        video_file_url: videoFileUrl,
        author_id: user.id,
      },
    ]);

    if (!error) {
      setTitle('');
      setContent('');
      setImageUrl('');
      setVideoUrl('');
      setVideoType(null);
      setVideoFileUrl('');
      setPreviewUrl('');
      fetchNews();
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading news...</div>;
  }

  function getYoutubeId(url: string) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&\?]{10,12})/);
    return match && match[1];
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h2 className="text-xl font-semibold mb-4">Create News Article</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border rounded-lg p-2"
              rows={4}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-1 text-sm text-gray-600">
                    {uploading ? 'Uploading...' : 'Click or drag to upload an image'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video
            </label>
            {videoType ? (
              <div className="relative">
                {videoType === 'youtube' && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Youtube size={20} />
                      <span>YouTube Video</span>
                    </div>
                    <p className="text-sm text-gray-500 break-all">{videoUrl}</p>
                  </div>
                )}
                {videoType === 'upload' && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Video size={20} />
                      <span>Uploaded Video</span>
                    </div>
                    <video controls className="w-full rounded-lg">
                      <source src={videoFileUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearVideo}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Video className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Upload video'}
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    type="url"
                    placeholder="Or paste YouTube URL"
                    className="w-full border rounded-lg p-4 h-full"
                    onChange={(e) => handleYoutubeUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Publish Article
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Published Articles</h2>
        <div className="space-y-4">
          {news.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
              <p className="text-gray-600 mb-2">{article.content}</p>
              {article.image_url && (
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

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
                <video controls className="w-full mt-4 rounded-lg">
                  <source src={article.video_file_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              <div className="text-sm text-gray-500 mt-2">
                {new Date(article.created_at).toLocaleString()}
              </div>
            </div>
          ))}
          {news.length === 0 && (
            <div className="text-center text-gray-600">No articles published yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          {icon}
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <h3 className="text-gray-600 font-medium">{title}</h3>
    </div>
  );
}

// Main Admin Dashboard Component
function AdminDashboard() {
  const location = useLocation();
  const navigation = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/news', icon: Newspaper, label: 'News' },
    { path: '/admin/email', icon: Mail, label: 'Email' },
  ];

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <nav className="flex space-x-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="news" element={<NewsList />} />
        <Route path="news/new" element={<NewsEditor />} />
        <Route path="news/:id" element={<NewsEditor />} />
        <Route path="email" element={<EmailManagement />} />
        <Route path="email/templates" element={<EmailTemplates />} />
      </Routes>
    </div>
  );
}

export default AdminDashboard;