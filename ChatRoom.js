import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faPlusCircle,
  faHistory,
  faHome,
  faPaperPlane,
  faUserAstronaut,
  faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from './auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles/ChatTabs.css';

const ChatTabs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const chatUserEmail = location.state?.chatUserEmail || null;

  const [activeTab, setActiveTab] = useState('chats');
  const [conversations, setConversations] = useState([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const latestMessagesRef = useRef([]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/chat/user-conversations/${user?.Email}`);
      setConversations(res.data);
    } catch (err) {
      toast.error('Failed to load chats');
    }
  }, [user.Email]);

  const fetchMessages = useCallback(
    async (convId) => {
      if (!convId) return;
      try {
        const res = await axios.get(`http://localhost:3000/api/chat/messages/${convId}`);
        const newMessages = res.data;

        if (
          latestMessagesRef.current.length > 0 &&
          newMessages.length > latestMessagesRef.current.length
        ) {
          const lastNewMsg = newMessages[newMessages.length - 1];
          const lastOldMsg = latestMessagesRef.current[latestMessagesRef.current.length - 1];

          if (
            lastNewMsg.MessageText !== lastOldMsg.MessageText &&
            lastNewMsg.SenderEmail !== user.Email
          ) {
            toast.info(`New message from "${lastNewMsg.SenderEmail}"`);
          }
        }

        setMessages(newMessages);
        latestMessagesRef.current = newMessages;
      } catch (err) {
        toast.error('Server is down.');
        navigate(user?.UserType === 'Staff' ? '/admin/dashboard' : '/home');
      }
    },
    [user.Email]
  );

  const initiateConversation = async (email = recipientEmail) => {
    if (!email) {
      toast.warn('Enter a valid recipient email');
      return;
    }

    // Check for existing conversation
    const existing = conversations.find(
      (conv) =>
        conv.ParticipantEmail.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      setRecipientEmail(existing.ParticipantEmail);
      setConversationId(existing.ConversationID);
      setMessages([]);
      latestMessagesRef.current = [];
      setActiveTab('chatroom');
      fetchMessages(existing.ConversationID);
      toast.info(`Resumed conversation with ${email}`);
      return;
    }

    // Otherwise, create new conversation
    try {
      const res = await axios.post(`http://localhost:3000/api/chat/start`, {
        user1: user.Email,
        user2: email,
      });
      setConversationId(res.data.ConversationID);
      setRecipientEmail(email);
      setMessages([]);
      latestMessagesRef.current = [];
      setActiveTab('chatroom');
      fetchConversations(); // Refresh conversation list
      toast.success(`Conversation started with ${email}`);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Recipient not found');
      } else {
        toast.error('Failed to start conversation');
      }
    }
  };

  const openConversation = (convId) => {
    const selectedConv = conversations.find((c) => c.ConversationID === convId);
    if (selectedConv) {
      setRecipientEmail(selectedConv.ParticipantEmail);
    }
    setConversationId(convId);
    setMessages([]);
    latestMessagesRef.current = [];
    setActiveTab('chatroom');
    fetchMessages(convId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await axios.post('http://localhost:3000/api/chat/message', {
        conversationId,
        senderEmail: user.Email,
        messageText: newMessage,
      });
      setNewMessage('');
      fetchMessages(conversationId);
    } catch (err) {
      toast.error('Message send failed');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    const handleChatInit = async () => {
      if (chatUserEmail && recipientEmail !== chatUserEmail) {
        await fetchConversations();
        initiateConversation(chatUserEmail);
      }
    };
    handleChatInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatUserEmail, recipientEmail]);


  useEffect(() => {
    if (activeTab === 'chats') {
      fetchConversations();
    }
  }, [activeTab, fetchConversations]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    let interval;
    if (conversationId && document.visibilityState === 'visible') {
      interval = setInterval(() => fetchMessages(conversationId), 5000);
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages(conversationId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [conversationId, fetchMessages]);


  // 🔐 Protected Route Check
  useEffect(() => {
    if (!user || !user.Email) {
      toast.error('Access Denied! Please log in to access the chatroom');
      navigate('/login');
    }
  }, [user, navigate]);

  const renderTabContent = () => {
    if (activeTab === 'new') {
      return (
        <div className="new-chat">
          <h4>Start a new chat</h4>
          <input
            type="email"
            value={recipientEmail}
            placeholder="Enter recipient's email"
            onKeyDown={(e) => {
              if (e.key === 'Enter') initiateConversation(recipientEmail);
            }}
          />
          <button onClick={() => initiateConversation(recipientEmail)}>
            <FontAwesomeIcon icon={faPaperPlane} /> Start Chat
          </button>
        </div>
      );
    }

    if (activeTab === 'chats') {
      return (
        <div className="chats-container">
          
          {conversations.length === 0 ? (
            <p>No recent chats</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.ConversationID}
                className="chat-card"
                onClick={() => openConversation(conv.ConversationID)}
              >
                <FontAwesomeIcon icon={faUser} size="2x" /> {conv.ParticipantEmail}
              </div>
            ))
          )}

        </div>
      );
    }

    if (activeTab === 'chatroom') {
      return (
        <div className="chat-container">
          <ToastContainer />
          <div className="chat-header">

            <FontAwesomeIcon icon={faUserCircle} className="header-icon" />
            {conversationId ? (
              <span>Chat with: {recipientEmail}</span>
            ) : (
              'Chat Room'
            )}
          </div>

          {!conversationId && (
            <div className="chat-input">
              <input
                type="email"
                value={recipientEmail}
                placeholder="Enter recipient's email"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') initiateConversation(recipientEmail);
                }}
              />
              <button onClick={() => initiateConversation(recipientEmail)}>
                <FontAwesomeIcon icon={faPaperPlane} /> Start
              </button>
            </div>
          )}

          {conversationId && (
            <>
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="empty-chat">No messages yet. Say hi 👋</div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`chat-bubble ${msg.SenderEmail === user.Email ? 'user' : 'other'}`}
                    >
                      <FontAwesomeIcon
                        icon={msg.SenderEmail === user.Email ? faUserAstronaut : faUserAstronaut}
                        className="sender-icon"
                      />
                      <div className="bubble-text">{msg.MessageText}</div>
                      <div className="bubble-time">
                        {new Date(new Date(msg.SentAt).setHours(new Date(msg.SentAt).getHours() - 2)).toLocaleTimeString([], {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input">
                <textarea
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}

                />
                <button type="submit" title='Send' onClick={sendMessage} id="send-btn">
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </>
          )}
        </div>
      );
    }
  };

  return (
    <div className="chat-tabs">
      <ToastContainer />
      <div className="tabs-header">
        <button onClick={() => setActiveTab('chats')}>
          <FontAwesomeIcon icon={faHistory} /> Recents
        </button>
        <button onClick={() => setActiveTab('new')}>
          <FontAwesomeIcon icon={faPlusCircle} /> New Chat
        </button>
        <button
          onClick={() =>
            navigate(user.UserType === 'Staff' ? '/admin/dashboard' : '/home')
          }
        >
          <FontAwesomeIcon icon={faHome} /> Home
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default ChatTabs;
