import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Users, BookTemplate as Template, Send } from 'lucide-react';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];

export default function EmailManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [usersResult, templatesResult] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('email_templates').select('*').order('name')
    ]);

    if (usersResult.data) setUsers(usersResult.data);
    if (templatesResult.data) setTemplates(templatesResult.data);
    setLoading(false);
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    if (!customSubject.trim() || !customContent.trim()) {
      alert('Please fill in both subject and content');
      return;
    }

    try {
      setSending(true);

      // Create sent_emails records for each recipient
      const emailPromises = selectedUsers.map(userId =>
        supabase.from('sent_emails').insert([{
          template_id: selectedTemplate || null,
          user_id: userId,
          subject: customSubject,
          content: customContent,
          status: 'pending'
        }])
      );

      await Promise.all(emailPromises);

      // Clear form
      setSelectedUsers([]);
      setSelectedTemplate('');
      setCustomSubject('');
      setCustomContent('');

      alert('Emails queued for sending!');
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Error sending emails');
    } finally {
      setSending(false);
    }
  }

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomSubject(template.subject);
      setCustomContent(template.content);
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Management</h2>
        <button
          onClick={() => navigate('/admin/email/templates')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Template size={20} />
          Manage Templates
        </button>
      </div>

      <form onSubmit={handleSendEmail} className="space-y-6">
        {/* Recipients Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} />
            Select Recipients
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {users.map(user => (
              <label
                key={user.id}
                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => {
                    setSelectedUsers(prev =>
                      e.target.checked
                        ? [...prev, user.id]
                        : prev.filter(id => id !== user.id)
                    );
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{user.full_name || 'Unnamed User'}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {selectedUsers.length} recipient(s) selected
          </div>
        </div>

        {/* Email Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail size={20} />
            Email Content
          </h3>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Use Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Select a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              className="w-full border rounded-lg p-2"
              rows={8}
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={sending || selectedUsers.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
          {sending ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </div>
  );
}