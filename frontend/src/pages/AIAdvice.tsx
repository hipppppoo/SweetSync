import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
} 

interface ChatHistory {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const AIAdvice: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChatHistories();
  }, []);

  const fetchChatHistories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/chat-history');
      setChatHistories(response.data);
    } catch (error) {
      console.error('Error fetching chat histories:', error);
    }
  };

  const loadChatHistory = async (chatId: string) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/chat-history/${chatId}`);
      setMessages(response.data.messages);
      setSelectedChat(chatId);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError('Failed to load chat history');
    }
  };

  const saveChat = async () => {
    if (!chatTitle.trim()) {
      setError('Please enter a title for the chat');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/chat-history', {
        title: chatTitle,
        messages,
      });
      setChatHistories([...chatHistories, response.data]);
      setShowSaveDialog(false);
      setChatTitle('');
      setSelectedChat(response.data._id);
    } catch (error) {
      console.error('Error saving chat:', error);
      setError('Failed to save chat');
    }
  };

  const updateChat = async () => {
    if (!selectedChat) return;

    try {
      await axios.put(`http://localhost:3000/api/chat-history/${selectedChat}`, {
        messages,
      });
    } catch (error) {
      console.error('Error updating chat:', error);
      setError('Failed to update chat');
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/chat-history/${chatId}`);
      setChatHistories(chatHistories.filter(chat => chat._id !== chatId));
      if (selectedChat === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage;

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/ai-advice', {
        message: messageContent,
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: response.data.advice,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      if (selectedChat) {
        await updateChat();
      }
    } catch (err) {
      console.error('Error getting AI advice:', err);
      setError('Failed to get AI advice. Please try again.');
    } finally {
      setIsLoading(false);
      // Delay focus slightly to ensure the input is enabled
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSelectedChat(null);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex gap-4">
        {/* Chat History Sidebar */}
        <div className="w-1/4 bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary-dark">Chat History</h2>
            <button
              onClick={startNewChat}
              className="btn btn-secondary btn-sm"
            >
              New Chat
            </button>
          </div>
          <div className="space-y-2">
            {chatHistories.map((chat) => (
              <div
                key={chat._id}
                className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                  selectedChat === chat._id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                <div
                  className="flex-1 truncate mr-2"
                  onClick={() => loadChatHistory(chat._id)}
                >
                  {chat.title}
                </div>
                <button
                  onClick={() => deleteChat(chat._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-8 text-primary-dark">AI Relationship Advice</h1>
          
          {/* Messages Container */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 h-[900px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500">
                <p className="mb-4">Welcome to your AI Relationship Advisor!</p>
                <p>Ask any question about:</p>
                <ul className="list-disc list-inside mb-4">
                  <li>Communication tips</li>
                  <li>Date ideas</li>
                  <li>Conflict resolution</li>
                  <li>Building trust</li>
                  <li>Quality time suggestions</li>
                  <li>Understanding each other better</li>
                </ul>
                <p>Your conversations are private and secure.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Input Form */}
          <div className="flex gap-4">
            <form onSubmit={handleSubmit} className="flex-1 flex gap-4">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your question here..."
                className="flex-1 border rounded-lg px-4 py-3"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`btn btn-primary ${
                  isLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Thinking...' : 'Ask'}
              </button>
            </form>
            {messages.length > 0 && !selectedChat && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="btn btn-primary"
              >
                Save Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Save Chat</h2>
            <input
              type="text"
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              placeholder="Enter a title for this chat"
              className="w-full border rounded-lg px-4 py-2 mb-4"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveChat}
                className="btn btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAdvice; 