
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Coins, 
  Crown, 
  Gift, 
  Play, 
  Users, 
  Zap,
  Star,
  Check
} from 'lucide-react';

const CoinStorePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coinPackages, purchaseCoins, watchAd, referFriend, coinHistory } = useCoin();
  const [referralEmail, setReferralEmail] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const features = [
    { icon: '💬', text: 'Send messages', cost: '2 coins' },
    { icon: '📞', text: 'Voice calls', cost: '10 coins' },
    { icon: '📹', text: 'Video calls', cost: '20 coins' },
    { icon: '💜', text: 'Like profiles', cost: '5 coins' },
    { icon: '⚡', text: 'Super likes', cost: '15 coins' },
    { icon: '👑', text: 'Boost profile', cost: '50 coins' }
  ];

  const earnMethods = [
    {
      icon: Gift,
      title: 'Daily Bonus',
      description: 'Login daily to earn free coins',
      reward: '10 coins',
      action: () => {},
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Play,
      title: 'Watch Ads',
      description: 'Watch short videos to earn coins',
      reward: '5 coins',
      action: watchAd,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Refer Friends',
      description: 'Invite friends and earn together',
      reward: '25 coins',
      action: () => referFriend(referralEmail),
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen p-4">
      <Helmet>
        <title>Coin Store - SocialChat</title>
        <meta name="description" content="Buy coins for premium features, earn free coins through daily bonuses, ads, and referrals. Enhance your SocialChat experience." />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
            <Coins className="w-6 h-6 text-yellow-500" />
            <span className="text-xl font-bold text-white">{user.coins}</span>
            <span className="text-white/70">coins</span>
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Coin Store</h1>
          <p className="text-white/70">Get more coins to unlock premium features</p>
        </motion.div>

        {/* What You Can Do */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                What You Can Do With Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <p className="text-white font-medium">{feature.text}</p>
                      <p className="text-white/70 text-sm">{feature.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Coin Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Buy Coins</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {coinPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card className={`glass-effect border-white/20 cursor-pointer hover:border-white/40 transition-all duration-300 relative ${
                  pkg.popular ? 'ring-2 ring-purple-500' : ''
                }`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Coins className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{pkg.coins}</h3>
                      <p className="text-white/70">coins</p>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">${pkg.price}</span>
                    </div>
                    
                    <Button
                      onClick={() => purchaseCoins(pkg.id)}
                      className={`w-full ${
                        pkg.popular 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                      } text-white font-semibold`}
                    >
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Earn Free Coins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Earn Free Coins</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {earnMethods.map((method, index) => (
              <Card key={index} className="glass-effect border-white/20">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${method.gradient} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <method.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{method.title}</h3>
                    <p className="text-white/70 text-sm mb-3">{method.description}</p>
                    <Badge className="bg-green-500 text-white border-0">
                      {method.reward}
                    </Badge>
                  </div>

                  {method.title === 'Refer Friends' ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="Friend's email"
                        value={referralEmail}
                        onChange={(e) => setReferralEmail(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                      <Button
                        onClick={method.action}
                        disabled={!referralEmail}
                        className={`w-full bg-gradient-to-r ${method.gradient} hover:opacity-90 text-white`}
                      >
                        Send Invite
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={method.action}
                      className={`w-full bg-gradient-to-r ${method.gradient} hover:opacity-90 text-white`}
                    >
                      {method.title === 'Daily Bonus' ? 'Claim Bonus' : method.title}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {coinHistory.length > 0 ? (
                <div className="space-y-3">
                  {coinHistory.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'earn' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {transaction.type === 'earn' ? '+' : '-'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{transaction.description}</p>
                          <p className="text-white/50 text-sm">
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </p>
                        <p className="text-white/50 text-sm">Balance: {transaction.balance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70">No transactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CoinStorePage;
