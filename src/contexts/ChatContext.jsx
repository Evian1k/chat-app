import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const savedConversations = localStorage.getItem('socialchat_conversations');
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations));
    }
    
    setOnlineUsers([
      { id: '2', name: 'Alice', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', status: 'online' },
      { id: '3', name: 'Emma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', status: 'online' },
      { id: '4', name: 'Sofia', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', status: 'away' },
      { id: '5', name: 'Maya', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face', status: 'online' },
    ]);
  }, []);

  const receiveMessage = useCallback((senderId, content, type = 'text') => {
    const newMessage = {
      id: Date.now().toString(),
      senderId,
      recipientId: user.id,
      content,
      type,
      timestamp: new Date().toISOString(),
      status: 'received'
    };

    setConversations(prevConvos => {
      const updatedConversations = [...prevConvos];
      let conversationIndex = updatedConversations.findIndex(
        conv => conv.participants.includes(senderId)
      );

      if (conversationIndex !== -1) {
        updatedConversations[conversationIndex].messages.push(newMessage);
        updatedConversations[conversationIndex].lastMessage = newMessage;
        updatedConversations[conversationIndex].unreadCount = (updatedConversations[conversationIndex].unreadCount || 0) + 1;
        
        const conversation = updatedConversations.splice(conversationIndex, 1)[0];
        updatedConversations.unshift(conversation);
        
        localStorage.setItem('socialchat_conversations', JSON.stringify(updatedConversations));
        return updatedConversations;
      }
      return prevConvos; 
    });
  }, [user]);

  const sendMessage = useCallback(async (recipientId, message, type = 'text') => {
    if (!user) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      recipientId,
      content: message,
      type,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    setConversations(prevConvos => {
      const updatedConversations = [...prevConvos];
      let conversationIndex = updatedConversations.findIndex(
        conv => conv.participants.includes(recipientId)
      );

      const recipient = onlineUsers.find(u => u.id === recipientId);

      if (conversationIndex === -1) {
        const newConversation = {
          id: Date.now().toString(),
          participants: [user.id, recipientId],
          participantDetails: [user, recipient],
          messages: [newMessage],
          lastMessage: newMessage,
          unreadCount: 0
        };
        updatedConversations.unshift(newConversation);
      } else {
        updatedConversations[conversationIndex].messages.push(newMessage);
        updatedConversations[conversationIndex].lastMessage = newMessage;
        const conversation = updatedConversations.splice(conversationIndex, 1)[0];
        updatedConversations.unshift(conversation);
      }
      localStorage.setItem('socialchat_conversations', JSON.stringify(updatedConversations));
      return updatedConversations;
    });

    // Mock typing indicator and reply
    setTypingUsers(prev => [...prev, recipientId]);
    setTimeout(() => {
      setTypingUsers(prev => prev.filter(id => id !== recipientId));
      receiveMessage(recipientId, "Thanks for your message! 😊");
    }, 2500);

    return newMessage;
  }, [user, onlineUsers, receiveMessage]);

  const startVideoCall = (recipientId) => {
    toast({
      title: "Starting Video Call...",
      description: `Connecting with ${onlineUsers.find(u => u.id === recipientId)?.name}`,
    });
  };

  const blockUser = (userId) => {
    toast({
      title: "User blocked",
      description: "You won't see or hear from this user anymore.",
      variant: 'destructive'
    });
  };

  const reportUser = (userId, reason) => {
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep our community safe.",
    });
  };

  const value = {
    conversations,
    activeChat,
    setActiveChat,
    onlineUsers,
    typingUsers,
    sendMessage,
    receiveMessage,
    startVideoCall,
    blockUser,
    reportUser
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
