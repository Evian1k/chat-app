import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useCoin } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Coins, 
  Settings, 
  Search,
  LogOut,
  Crown,
  User,
  Star,
  Flame,
  Rocket
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { conversations, onlineUsers } = useChat();
  const { dailyBonus } = useCoin();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    dailyBonus();
  }, [user, navigate, dailyBonus]);

  if (!user) return null;

  const quickActions = [
    {
      icon: Search,
      title: "Discover",
      description: "Find new people",
      action: () => navigate('/matching'),
      gradient: "from-purple-600 to-fuchsia-600"
    },
    {
      icon: Flame,
      title: "Moments",
      description: "Share your life",
      action: () => navigate('/moments'),
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Rocket,
      title: "Missions",
      description: "Earn free coins",
      action: () => navigate('/missions'),
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      icon: Crown,
      title: "Go VIP",
      description: "Unlock perks",
      action: () => navigate('/vip'),
      gradient: "from-amber-400 to-yellow-500"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-6">
      <Helmet>
        <title>Dashboard - SocialChat</title>
        <meta name="description" content="Your SocialChat dashboard - manage conversations, find new matches, and connect with people worldwide." />
      </Helmet>
      <div className="aurora-bg" />

      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-purple-500 cursor-pointer" onClick={() => navigate('/profile')}>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xl">
                {user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Hey, {user.name}!
                {user.isVip && <Star className="w-5 h-5 text-yellow-400" />}
              </h1>
              <p className="text-white/60">Welcome to the future of connection.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 cursor-pointer" onClick={() => navigate('/coins')}>
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">{user.coins}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card 
                  className="glass-effect border-white/10 cursor-pointer hover:border-purple-500/50 transition-all duration-300 h-full"
                  onClick={action.action}
                >
                  <CardContent className="p-4 text-center flex flex-col items-center justify-center">
                    <div className={`bg-gradient-to-br ${action.gradient} p-3 rounded-full w-fit mb-3`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{action.title}</h3>
                    <p className="text-sm text-white/60">{action.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-effect border-white/10 h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Recent Conversations
                    </div>
                    <Button variant="ghost" className="text-sm text-purple-400 hover:text-purple-300" onClick={() => navigate('/chat')}>View All</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversations.length > 0 ? (
                  <div className="space-y-3">
                    {conversations.slice(0, 5).map((conversation) => {
                      const otherParticipant = conversation.participantDetails?.find(p => p.id !== user.id);
                      return (
                        <div
                          key={conversation.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-black/20 hover:bg-white/10 cursor-pointer transition-colors"
                          onClick={() => navigate(`/chat/${otherParticipant?.id}`)}
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white">
                              {otherParticipant?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-white truncate">{otherParticipant?.name}</h4>
                              <span className="text-xs text-white/50">
                                {new Date(conversation.lastMessage?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-white/60 truncate">
                              {conversation.lastMessage?.content}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-fuchsia-500 text-white shrink-0">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60">No conversations yet.</p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90"
                      onClick={() => navigate('/matching')}
                    >
                      Find People to Chat
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Online Now
                    </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {onlineUsers.slice(0, 4).map((onlineUser) => (
                    <div
                      key={onlineUser.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => navigate(`/chat/${onlineUser.id}`)}
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={onlineUser.avatar} alt={onlineUser.name} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white">
                            {onlineUser.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                          onlineUser.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{onlineUser.name}</h4>
                        <p className="text-xs text-white/50 capitalize">{onlineUser.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Conversations</span>
                  <span className="text-white font-semibold">{conversations.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Profile Views</span>
                  <span className="text-white font-semibold">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Matches</span>
                  <span className="text-white font-semibold">8</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;