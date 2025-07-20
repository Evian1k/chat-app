import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  X, 
  MapPin, 
  Sparkles, 
  Filter,
  ArrowLeft,
  Coins,
  Zap,
} from 'lucide-react';
import ShimmerLoader from '@/components/ShimmerLoader';

const MatchingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { spendCoins } = useCoin();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    // Simulate fetching matches
    setTimeout(() => {
      setMatches([
        { id: '2', name: 'Alice', age: 24, location: 'New York, USA', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600&h=800&fit=crop&crop=face', bio: 'Love traveling and trying new cuisines.', compatibility: 92 },
        { id: '3', name: 'Emma', age: 28, location: 'Los Angeles, USA', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop&crop=face', bio: 'Artist and coffee enthusiast.', compatibility: 88 },
        { id: '4', name: 'Sofia', age: 26, location: 'Miami, USA', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&crop=face', bio: 'Fitness trainer and yoga instructor.', compatibility: 85 },
        { id: '5', name: 'Maya', age: 23, location: 'San Francisco, USA', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&crop=face', bio: 'Tech enthusiast and gamer.', compatibility: 90 },
      ]);
      setIsLoading(false);
    }, 1500);
  }, [user, navigate]);

  const removeTopCard = () => {
    setMatches(prev => prev.slice(1));
  };

  const handleSwipe = (action) => {
    if (action === 'like') {
      if (!spendCoins(5, 'Like action')) return;
    } else if (action === 'superlike') {
      if (!spendCoins(15, 'Super like action')) return;
    }
    removeTopCard();
  };
  
  if (isLoading) {
    return <ShimmerLoader type="matching" />;
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-4 flex flex-col overflow-hidden">
      <Helmet>
        <title>Discover - SocialChat</title>
        <meta name="description" content="Discover amazing people with AI-powered matching. Swipe, match, and connect." />
      </Helmet>

      <header className="flex items-center justify-between mb-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-white">Discover</h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
          onClick={() => {}}
        >
          <Filter className="w-5 h-5" />
        </Button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center relative w-full">
        <AnimatePresence>
          {matches.length > 0 ? (
            matches.map((match, index) => (
              <MatchCard 
                key={match.id} 
                match={match}
                isActive={index === 0}
                onSwipe={handleSwipe}
              />
            )).reverse()
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <Sparkles className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">That's everyone for now!</h2>
              <p className="text-white/60">Come back later for new potential matches.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="flex justify-center items-center gap-4 mt-6 z-20">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleSwipe('pass')} className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-red-400 hover:bg-white/20 transition-colors">
          <X className="w-8 h-8" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleSwipe('superlike')} className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Zap className="w-10 h-10 text-white" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleSwipe('like')} className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
          <Heart className="w-8 h-8 text-white" />
        </motion.button>
      </footer>
      
      <div className="text-center mt-4 text-xs text-white/40 z-20">
        <p>💜 Like: 5 coins | ⚡ Super Like: 15 coins</p>
      </div>
    </div>
  );
};

const MatchCard = ({ match, isActive, onSwipe }) => {
  const x = useMotionValue(0);
  const xInput = [-150, 0, 150];
  const backgroundColor = useTransform(x, xInput, ["#ef4444", "rgba(255, 255, 255, 0)", "#34d399"]);
  const rotate = useTransform(x, xInput, [-10, 0, 10]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x < -100) {
      onSwipe('pass');
    } else if (info.offset.x > 100) {
      onSwipe('like');
    }
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: 'calc(100% - 2rem)',
        maxWidth: '384px',
        height: '70vh',
        maxHeight: '550px',
      }}
      initial={{ scale: 0.95, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.3 } }}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="w-full h-full overflow-hidden rounded-2xl shadow-2xl shadow-black/50 border-0 relative">
        <motion.div style={{ backgroundColor }} className="absolute inset-0 z-10" />
        <div className="relative w-full h-full">
          <img
            src={match.avatar}
            alt={match.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">{match.name}, {match.age}</h2>
              <Badge className="bg-purple-600/80 text-white border-0 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                {match.compatibility}%
              </Badge>
            </div>
            <div className="flex items-center text-white/70 text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{match.location}</span>
            </div>
            <p className="text-white/80 mt-2 text-sm line-clamp-2">{match.bio}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default MatchingPage;