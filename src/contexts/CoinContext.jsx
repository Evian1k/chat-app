
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const CoinContext = createContext();

export const useCoin = () => {
  const context = useContext(CoinContext);
  if (!context) {
    throw new Error('useCoin must be used within a CoinProvider');
  }
  return context;
};

export const CoinProvider = ({ children }) => {
  const { user, updateProfile } = useAuth();
  const [coinHistory, setCoinHistory] = useState([]);
  const [coinPackages, setCoinPackages] = useState([
    { id: 1, coins: 100, price: 0.99, popular: false },
    { id: 2, coins: 500, price: 4.99, popular: true },
    { id: 3, coins: 1000, price: 9.99, popular: false },
    { id: 4, coins: 2500, price: 19.99, popular: false },
    { id: 5, coins: 5000, price: 39.99, popular: false }
  ]);

  useEffect(() => {
    // Load coin history from localStorage
    const savedHistory = localStorage.getItem('socialchat_coin_history');
    if (savedHistory) {
      setCoinHistory(JSON.parse(savedHistory));
    }
  }, []);

  const spendCoins = (amount, description) => {
    if (!user || user.coins < amount) {
      toast({
        title: "Insufficient coins",
        description: "You don't have enough coins for this action.",
        variant: "destructive",
      });
      return false;
    }

    const newBalance = user.coins - amount;
    updateProfile({ coins: newBalance });

    const transaction = {
      id: Date.now().toString(),
      type: 'spend',
      amount: -amount,
      description,
      timestamp: new Date().toISOString(),
      balance: newBalance
    };

    const updatedHistory = [transaction, ...coinHistory];
    setCoinHistory(updatedHistory);
    localStorage.setItem('socialchat_coin_history', JSON.stringify(updatedHistory));

    toast({
      title: "Coins spent",
      description: `${amount} coins spent on ${description}`,
    });

    return true;
  };

  const earnCoins = (amount, description) => {
    if (!user) return;

    const newBalance = user.coins + amount;
    updateProfile({ coins: newBalance });

    const transaction = {
      id: Date.now().toString(),
      type: 'earn',
      amount: +amount,
      description,
      timestamp: new Date().toISOString(),
      balance: newBalance
    };

    const updatedHistory = [transaction, ...coinHistory];
    setCoinHistory(updatedHistory);
    localStorage.setItem('socialchat_coin_history', JSON.stringify(updatedHistory));

    toast({
      title: "Coins earned!",
      description: `You earned ${amount} coins from ${description}`,
    });
  };

  const purchaseCoins = async (packageId) => {
    const selectedPackage = coinPackages.find(pkg => pkg.id === packageId);
    if (!selectedPackage) return;

    try {
      // Mock Stripe payment
      toast({
        title: "🚧 Payment processing isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      });

      // Simulate successful purchase for demo
      setTimeout(() => {
        earnCoins(selectedPackage.coins, `Coin package purchase ($${selectedPackage.price})`);
      }, 2000);

    } catch (error) {
      toast({
        title: "Purchase failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const dailyBonus = () => {
    const lastBonus = localStorage.getItem('socialchat_last_bonus');
    const today = new Date().toDateString();
    
    if (lastBonus !== today) {
      earnCoins(10, 'Daily login bonus');
      localStorage.setItem('socialchat_last_bonus', today);
      return true;
    }
    
    return false;
  };

  const watchAd = () => {
    // Mock ad watching
    toast({
      title: "🚧 Ad system isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
    
    // Simulate earning coins from ad
    setTimeout(() => {
      earnCoins(5, 'Watched advertisement');
    }, 3000);
  };

  const referFriend = (friendEmail) => {
    // Mock referral system
    earnCoins(25, `Referred friend: ${friendEmail}`);
  };

  const value = {
    coinHistory,
    coinPackages,
    spendCoins,
    earnCoins,
    purchaseCoins,
    dailyBonus,
    watchAd,
    referFriend
  };

  return (
    <CoinContext.Provider value={value}>
      {children}
    </CoinContext.Provider>
  );
};
