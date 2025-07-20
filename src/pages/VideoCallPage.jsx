import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare } from 'lucide-react';

const VideoCallPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const { onlineUsers } = useChat();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const participant = onlineUsers.find(u => u.id === userId);

  useEffect(() => {
    if (!user || !participant) {
      navigate('/dashboard');
      return;
    }
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [user, participant, navigate]);
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!participant) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      <Helmet>
        <title>Video Call with {participant.name} - SocialChat</title>
      </Helmet>

      <div className="absolute inset-0 z-0">
        <img  class="w-full h-full object-cover filter blur-md scale-110" alt="Remote user blurred background" src="https://images.unsplash.com/photo-1585092284034-48c72302862c" />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <main className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-lg overflow-hidden">
          <img  class="w-full h-full object-cover" alt="Remote user video stream" src="https://images.unsplash.com/photo-1604752778216-d868accea68e" />
          <div className="absolute bottom-4 left-4 text-lg font-semibold bg-black/40 px-3 py-1 rounded-md">{participant.name}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{delay: 0.2}} className="relative rounded-lg overflow-hidden md:absolute md:w-1/4 md:h-auto md:aspect-video md:bottom-4 md:right-4">
          <img  class="w-full h-full object-cover" alt="Local user video stream" src="https://images.unsplash.com/photo-1604752778216-d868accea68e" />
          <div className="absolute bottom-2 left-2 text-sm font-semibold bg-black/40 px-2 py-0.5 rounded-md">You</div>
        </motion.div>
      </main>

      <footer className="relative z-10 p-4">
        <motion.div 
          initial={{ y: 100 }} 
          animate={{ y: 0 }} 
          transition={{ type: 'spring', stiffness: 100 }}
          className="bg-black/40 backdrop-blur-md rounded-full max-w-md mx-auto p-3 flex items-center justify-center gap-4"
        >
          <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <MicOff className="w-6 h-6 text-red-400" /> : <Mic className="w-6 h-6" />}
          </Button>
          <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20" onClick={() => setIsVideoOff(!isVideoOff)}>
            {isVideoOff ? <VideoOff className="w-6 h-6 text-red-400" /> : <Video className="w-6 h-6" />}
          </Button>
          <Button variant="destructive" size="icon" className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700" onClick={() => navigate('/chat')}>
            <PhoneOff className="w-7 h-7" />
          </Button>
          <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20">
            <MessageSquare className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20">
            <Users className="w-6 h-6" />
          </Button>
        </motion.div>
        <div className="text-center mt-3 text-sm text-white/70 bg-black/30 px-3 py-1 rounded-full w-fit mx-auto">
          {formatDuration(callDuration)}
        </div>
      </footer>
    </div>
  );
};

export default VideoCallPage;