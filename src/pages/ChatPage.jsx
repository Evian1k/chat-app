import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useCoin } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, Send, Video, Phone, MoreVertical, Smile, Paperclip, Mic,
  Globe, Shield, Flag, Coins, MessageCircle, UserX, AlertTriangle
} from 'lucide-react';
import ShimmerLoader from '@/components/ShimmerLoader';
import { toast } from '@/components/ui/use-toast';

const ChatPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const { conversations, onlineUsers, sendMessage, startVideoCall, blockUser, reportUser, typingUsers } = useChat();
  const { spendCoins } = useCoin();
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    let initialUser = null;
    if (userId) {
      initialUser = onlineUsers.find(u => u.id === userId) || conversations.find(c => c.participantDetails.some(p => p.id === userId))?.participantDetails.find(p => p.id === userId);
    } else if (conversations.length > 0) {
      initialUser = conversations[0].participantDetails?.find(p => p.id !== user.id);
    }
    
    if (initialUser) {
        setSelectedUser(initialUser);
        const conversation = conversations.find(conv => conv.participants.includes(initialUser.id));
        setCurrentConversation(conversation);
    }
    setTimeout(() => setIsLoading(false), 500);
  }, [userId, conversations, onlineUsers, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser) return;
    if (spendCoins(2, 'Send message')) {
      await sendMessage(selectedUser.id, message);
      setMessage('');
    }
  };

  const handleVideoCall = () => {
    if (spendCoins(20, 'Video call')) {
      startVideoCall(selectedUser.id);
      navigate(`/call/${selectedUser.id}`);
    }
  };
  
  const handleBlock = () => {
    if(!selectedUser) return;
    blockUser(selectedUser.id);
    setSelectedUser(null);
    setCurrentConversation(null);
    navigate('/chat');
  };
  
  const handleReport = () => {
    if(!selectedUser) return;
    reportUser(selectedUser.id, 'Inappropriate behavior');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (isLoading) return <ShimmerLoader type="chat" />;

  if (!user) {
    navigate('/login');
    return null;
  }
  
  const isTyping = selectedUser && typingUsers.includes(selectedUser.id);

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Helmet>
        <title>{selectedUser ? `Chat with ${selectedUser.name}` : 'Chat'} - SocialChat</title>
        <meta name="description" content="Real-time chat with voice messages, video calls, and auto-translation features." />
      </Helmet>

      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence>
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden md:block w-80 bg-black/30 backdrop-blur-md border-r border-white/10 flex-shrink-0"
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold text-white text-lg">Conversations</h3>
            </div>
            <div className="space-y-1 p-2 overflow-y-auto h-full">
              {conversations.map((conv) => {
                const p = conv.participantDetails?.find(p => p.id !== user.id);
                if (!p) return null;
                return (
                  <div key={conv.id} onClick={() => navigate(`/chat/${p.id}`)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedUser?.id === p.id ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-fuchsia-600">{p.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{p.name}</h4>
                      <p className="text-sm text-white/60 truncate">{conv.lastMessage?.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </AnimatePresence>

        <main className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-white md:hidden" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-5 h-5" /></Button>
                  <Avatar className="w-10 h-10"><AvatarImage src={selectedUser.avatar} /><AvatarFallback>{selectedUser.name?.charAt(0)}</AvatarFallback></Avatar>
                  <div>
                    <h2 className="font-semibold text-white">{selectedUser.name}</h2>
                    <p className="text-xs text-white/70 flex items-center gap-1.5">{isTyping ? "typing..." : "Online"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" onClick={handleVideoCall}><Video className="w-5 h-5" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white/70 hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-black/50 backdrop-blur-lg border-white/20 text-white">
                      <DropdownMenuItem onSelect={handleBlock} className="text-red-400 focus:bg-red-500/20 focus:text-red-300"><UserX className="w-4 h-4 mr-2" />Block User</DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleReport} className="text-yellow-400 focus:bg-yellow-500/20 focus:text-yellow-300"><AlertTriangle className="w-4 h-4 mr-2" />Report User</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {currentConversation?.messages?.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    {msg.senderId !== user.id && <Avatar className="w-8 h-8"><AvatarImage src={selectedUser.avatar} /></Avatar>}
                    <div className={`chat-bubble ${msg.senderId === user.id ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                      <p>{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2 justify-start">
                     <Avatar className="w-8 h-8"><AvatarImage src={selectedUser.avatar} /></Avatar>
                     <div className="chat-bubble chat-bubble-received typing-indicator"><span></span><span></span><span></span></div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <footer className="p-4 bg-black/30 backdrop-blur-sm border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-white"><Paperclip className="w-5 h-5" /></Button>
                  <div className="flex-1 relative">
                    <Input value={message} onChange={e => setMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type a message..." className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10" />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"><Smile className="w-5 h-5" /></Button>
                  </div>
                  <Button onClick={handleSendMessage} disabled={!message.trim()} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white rounded-full w-10 h-10 p-0"><Send className="w-5 h-5" /></Button>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-white/50">
                  <span>💬 2 coins</span>
                  <div className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-500" /><span>{user.coins}</span></div>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white">Your Messages</h3>
                <p className="text-white/60">Select a conversation to start chatting.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;