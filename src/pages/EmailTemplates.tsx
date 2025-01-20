import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookTemplate as Template, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import type { Database } from '../types/supabase';

type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];

export default function EmailTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('name');

    if (data) {
      setTemplates(data);
    }
    setLoading(false);
  }

  function handleEdit(template: EmailTemplate) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (!error) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingTemplate) {
      // Update existing template
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: formData.name,
          subject: formData.subject,
          content: formData.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTemplate.id);

      if (!error) {
        setEditingTemplate(null);
        fetchTemplates();
      }
    } else {
      // Create new template
      const { error } = await supabase
        .from('email_templates')
        .insert([{
          name: formData.name,
          subject: formData.subject,
          content: formData.content
        }]);

      if (!error) {
        fetchTemplates();
      }
    }

    // Reset form
    setFormData({ name: '', subject: '', content: '' });
  }

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/email')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Email Templates</h2>
      </div>

      {/* Template Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Template size={20} />
          {editingTemplate ? 'Edit Template' : 'Create New Template'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full border rounded-lg p-2"
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end gap-4">
            {editingTemplate && (
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(null);
                  setFormData({ name: '', subject: '', content: '' });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </div>
      </form>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Saved Templates</h3>
          <div className="space-y-4">
            {templates.map(template => (
              <div
                key={template.id}
                className="border rounded-lg p-4 hover:border-blue-200 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-gray-600 text-sm line-clamp-2">
                  {template.content}
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="text-center text-gray-600 py-8">
                No templates yet. Create your first template above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
