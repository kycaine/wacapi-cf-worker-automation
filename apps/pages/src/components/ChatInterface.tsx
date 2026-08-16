import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface Contact {
  sender_number: string;
  message_text: string;
  created_at: string;
}

interface ChatMessage {
  id: number;
  sender_number: string;
  direction: 'IN' | 'OUT';
  message_text: string;
  command: string | null;
  status: string;
  latency_ms: number;
  created_at: string;
}

const ChatInterface: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact);
      // Poll for new messages for selected contact
      const interval = setInterval(() => fetchMessages(selectedContact), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/api/stats/contacts');
      setContacts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchMessages = async (number: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/api/stats/logs/${number}`);
      setMessages(res.data.data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden flex h-[600px] border border-gray-200">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-medium text-gray-900">Recent Chats</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {loadingContacts ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No chats found</div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.sender_number}
                onClick={() => setSelectedContact(contact.sender_number)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-100 transition duration-150 ${
                  selectedContact === contact.sender_number ? 'bg-primary-50 border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">
                    {contact.sender_number}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(contact.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {contact.message_text || 'Media/Event'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col bg-[#efeae2]">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center shadow-sm z-10">
              <div className="bg-gray-200 p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">{selectedContact}</h2>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages && messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-4">Loading messages...</div>
              ) : (
                messages.map((msg) => {
                  const isOut = msg.direction === 'OUT';
                  return (
                    <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-[75%] rounded-lg px-4 py-2 shadow-sm relative ${
                          isOut ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap mb-1">{msg.message_text}</p>
                        
                        {msg.command && (
                          <div className="mt-1 mb-1 inline-block bg-black bg-opacity-5 rounded px-2 py-0.5 text-xs font-mono text-gray-600">
                            {msg.command}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          {msg.latency_ms > 0 && (
                            <span className="text-[10px] text-gray-400 flex items-center" title="Execution latency">
                              <Clock className="w-3 h-3 mr-0.5" />
                              {msg.latency_ms}ms
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            {formatTime(msg.created_at)}
                          </span>
                          {isOut && msg.status === 'ERROR' && (
                            <AlertCircle className="w-3 h-3 text-red-500 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium">Select a contact to view chat</p>
            <p className="text-sm">Click on a phone number from the list on the left.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
