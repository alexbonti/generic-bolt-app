import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Database } from '../types/supabase';

type Ticket = Database['public']['Tables']['tickets']['Row'];
type Message = Database['public']['Tables']['ticket_messages']['Row'];

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  async function fetchTicketDetails() {
    if (!id) return;

    const [ticketResult, messagesResult] = await Promise.all([
      supabase.from('tickets').select('*').eq('id', id).single(),
      supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true }),
    ]);

    if (ticketResult.data) {
      setTicket(ticketResult.data);
    }
    if (messagesResult.data) {
      setMessages(messagesResult.data);
    }
    setLoading(false);
  }

  async function handleSubmitMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !user || !newMessage.trim()) return;

    const { error } = await supabase.from('ticket_messages').insert([
      {
        ticket_id: id,
        user_id: user.id,
        message: newMessage.trim(),
      },
    ]);

    if (!error) {
      setNewMessage('');
      fetchTicketDetails();
    }
  }

  async function handleStatusChange(newStatus: Ticket['status']) {
    if (!id || !ticket) return;

    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      fetchTicketDetails();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600">Loading ticket details...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">Ticket not found</div>
        <button
          onClick={() => navigate('/tickets')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to tickets
        </button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/tickets')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to tickets
        </button>
        <h1 className="text-3xl font-bold mb-2">{ticket.title}</h1>
        <div className="flex items-center gap-4">
          <span
            className={`px-2 py-1 text-sm font-semibold rounded-full ${
              ticket.status === 'new'
                ? 'bg-blue-100 text-blue-800'
                : ticket.status === 'in_progress'
                ? 'bg-yellow-100 text-yellow-800'
                : ticket.status === 'resolved'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {ticket.status.replace('_', ' ')}
          </span>
          {user?.role === 'admin' && (
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as Ticket['status'])}
              className="border rounded-md px-2 py-1"
            >
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Description</h2>
        <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Messages</h2>
        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.user_id === user?.id
                  ? 'bg-blue-50 ml-8'
                  : 'bg-gray-50 mr-8'
              }`}
            >
              <p className="text-sm text-gray-500 mb-1">
                {new Date(message.created_at).toLocaleString()}
              </p>
              <p className="text-gray-700">{message.message}</p>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-gray-600">No messages yet.</div>
          )}
        </div>

        <form onSubmit={handleSubmitMessage}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full border rounded-lg p-3 mb-4"
            rows={3}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
