import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Briefcase, MapPin, Globe, Plus, Pencil, Upload, X } from 'lucide-react';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    bio: '',
    location: '',
    website: '',
    company: '',
    position: '',
    skills: [] as string[],
    newSkill: ''
  });

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        headline: data.headline || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        company: data.company || '',
        position: data.position || '',
        skills: data.skills || [],
        newSkill: ''
      });
    }
    setLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      setUploading(true);

      // Create a unique file name to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatar-images')
        .upload(fileName, file, { 
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        throw uploadError;
      }

      if (!data) {
        throw new Error('Upload failed - no data returned');
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatar-images')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        // If profile update fails, try to delete the uploaded file
        await supabase.storage
          .from('avatar-images')
          .remove([fileName]);
        throw updateError;
      }

      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          headline: formData.headline,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          company: formData.company,
          position: formData.position,
          skills: formData.skills
        })
        .eq('id', user.id);

      if (error) throw error;
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  }

  function handleAddSkill() {
    if (formData.newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: ''
      }));
    }
  }

  function handleRemoveSkill(skillToRemove: string) {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Cover section */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg" />

        {/* Profile section */}
        <div className="px-8 pb-8">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-4xl font-semibold">
                  {(profile.full_name?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            {isOwnProfile && !editing && (
              <label className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-md cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Upload size={20} className={`${uploading ? 'text-gray-400' : 'text-gray-600'}`} />
              </label>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="headline" className="block text-sm font-medium text-gray-700">
                    Headline
                  </label>
                  <input
                    type="text"
                    id="headline"
                    value={formData.headline}
                    onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                      Position
                    </label>
                    <input
                      type="text"
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-600"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={formData.newSkill}
                      onChange={(e) => setFormData(prev => ({ ...prev, newSkill: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Add a skill"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.full_name || 'Unnamed User'}
                  </h1>
                  {profile.headline && (
                    <p className="mt-1 text-lg text-gray-600">{profile.headline}</p>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-y-4 gap-x-8">
                  {profile.company && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase size={20} />
                      <span>{profile.position ? `${profile.position} at ${profile.company}` : profile.company}</span>
                    </div>
                  )}

                  {profile.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={20} />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  {profile.website && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe size={20} />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {new URL(profile.website).hostname}
                      </a>
                    </div>
                  )}
                </div>

                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-600"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {isOwnProfile && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border border-gray-300"
                    >
                      <Pencil size={16} />
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Rest of the component remains unchanged */}
          {/* ... */}
        </div>
      </div>
    </div>
  );
}