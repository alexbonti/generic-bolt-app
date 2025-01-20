import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function NewTicket() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('tickets').insert([
        {
          title: title.trim(),
          description: description.trim(),
          user_id: user.id,
          status: 'new'
        }
      ]);

      if (error) throw error;
      navigate('/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/tickets')}
          className="text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Back to tickets
        </button>

        <h1 className="text-3xl font-bold mb-8">Create New Ticket</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
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
              minLength={3}
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg p-2"
              rows={6}
              required
              minLength={10}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}
