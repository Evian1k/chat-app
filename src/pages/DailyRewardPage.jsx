import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useCoin } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Gift, Check, X } from 'lucide-react';

const DailyRewardPage = () => {
  const navigate = useNavigate();
  const { earnCoins } = useCoin();
  const [claimed, setClaimed] = useState(false);
  const [streak, setStreak] = useState(1);
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastClaimedDate = localStorage.getItem('socialchat_last_bonus');
    const currentStreak = parseInt(localStorage.getItem('socialchat_streak') || '0', 10);
    
    if (lastClaimedDate === today) {
      setClaimed(true);
    }
    setStreak(currentStreak + 1);

    const generatedRewards = Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      coins: (i + 1) * 5 + (i > 4 ? 20 : 0),
      isClaimed: i < currentStreak,
    }));
    setRewards(generatedRewards);

  }, []);

  const handleClaim = () => {
    const today = new Date().toDateString();
    earnCoins(rewards[streak - 1].coins, `Daily Reward - Day ${streak}`);
    localStorage.setItem('socialchat_last_bonus', today);
    localStorage.setItem('socialchat_streak', streak.toString());
    setClaimed(true);
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <Helmet>
        <title>Daily Rewards - SocialChat</title>
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="glass-effect border-purple-500/30">
          <button onClick={() => navigate('/dashboard')} className="absolute top-3 right-3 text-white/50 hover:text-white"><X /></button>
          <CardContent className="p-6 text-center">
            <Gift className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
            <h1 className="text-3xl font-bold text-white">Daily Rewards</h1>
            <p className="text-white/70 mt-2 mb-6">Come back every day for more free coins!</p>
            
            <div className="grid grid-cols-7 gap-2 mb-6">
              {rewards.map(({ day, coins, isClaimed }) => (
                <motion.div
                  key={day}
                  className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center
                    ${streak === day && !claimed ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/20'}
                    ${isClaimed || (streak === day && claimed) ? 'bg-green-500/30 border-green-500' : ''}
                  `}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="text-xs text-white/70">Day {day}</span>
                  <Coins className="w-5 h-5 text-yellow-400 my-1" />
                  <span className="text-sm font-semibold">{coins}</span>
                  {(isClaimed || (streak === day && claimed)) && <Check className="w-4 h-4 text-white absolute" />}
                </motion.div>
              ))}
            </div>

            {claimed ? (
              <div className="text-green-400 font-semibold">
                You've claimed your reward for today! Come back tomorrow.
              </div>
            ) : (
              <Button onClick={handleClaim} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white font-bold text-lg py-6">
                Claim {rewards[streak - 1]?.coins} Coins
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DailyRewardPage;