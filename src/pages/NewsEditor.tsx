import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Upload, X, Youtube, Video } from 'lucide-react';
import type { Database } from '../types/supabase';

type NewsArticle = Database['public']['Tables']['news']['Row'];

function getYoutubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&\?]{10,12})/);
  return match && match[1];
}

export default function NewsEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
    videoType: null as 'youtube' | 'upload' | null,
    videoFileUrl: ''
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  async function fetchArticle() {
    if (!id) return;

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching article:', error);
      navigate('/admin/news');
      return;
    }

    if (data) {
      setArticle(data);
      setFormData({
        title: data.title,
        content: data.content,
        imageUrl: data.image_url || '',
        videoUrl: data.video_url || '',
        videoType: data.video_type,
        videoFileUrl: data.video_file_url || ''
      });
      if (data.image_url) {
        setPreviewUrl(data.image_url);
      }
    }
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

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('news-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('news-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
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

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('news-videos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('news-videos')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        videoFileUrl: publicUrl,
        videoType: 'upload',
        videoUrl: ''
      }));
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video');
    } finally {
      setUploading(false);
    }
  }

  function handleYoutubeUrl(url: string) {
    setFormData(prev => ({
      ...prev,
      videoUrl: url,
      videoType: 'youtube',
      videoFileUrl: ''
    }));
  }

  function clearImage() {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setPreviewUrl('');
  }

  function clearVideo() {
    setFormData(prev => ({
      ...prev,
      videoUrl: '',
      videoType: null,
      videoFileUrl: ''
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const newsData = {
        title: formData.title,
        content: formData.content,
        image_url: formData.imageUrl,
        video_url: formData.videoUrl,
        video_type: formData.videoType,
        video_file_url: formData.videoFileUrl,
        author_id: user.id,
      };

      if (id) {
        // Update existing article
        const { error } = await supabase
          .from('news')
          .update(newsData)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Create new article
        const { error } = await supabase
          .from('news')
          .insert([newsData]);

        if (error) throw error;
      }

      navigate('/admin/news');
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Error saving article');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/admin/news')}
        className="text-blue-600 hover:text-blue-800 mb-6"
      >
        ← Back to News
      </button>

      <h1 className="text-3xl font-bold mb-8">
        {id ? 'Edit Article' : 'Create Article'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full border rounded-lg p-2"
              rows={8}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {uploading ? 'Uploading...' : 'Click or drag to upload an image'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video
            </label>
            {formData.videoType ? (
              <div className="relative">
                {formData.videoType === 'youtube' && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Youtube size={20} />
                      <span>YouTube Video</span>
                    </div>
                    <p className="text-sm text-gray-500 break-all">{formData.videoUrl}</p>
                    {formData.videoUrl && (
                      <div className="mt-4">
                        <iframe
                          width="100%"
                          height="315"
                          src={`https://www.youtube.com/embed/${getYoutubeId(formData.videoUrl)}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
                {formData.videoType === 'upload' && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Video size={20} />
                      <span>Uploaded Video</span>
                    </div>
                    <video controls className="w-full rounded-lg">
                      <source src={formData.videoFileUrl} type="video/mp4" />
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
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/news')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : id ? 'Update Article' : 'Publish Article'}
          </button>
        </div>
      </form>
    </div>
  );
}