import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Star, X } from 'lucide-react';
import { useCoin } from '@/contexts/CoinContext';

const CoinRechargeModal = ({ open, onOpenChange }) => {
  const { coinPackages, purchaseCoins } = useCoin();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Recharge Coins</DialogTitle>
          <DialogDescription className="text-center text-white/70">
            Never miss a connection. Top up your coins to continue enjoying premium features.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-3 gap-4 py-6">
          {coinPackages.slice(0, 3).map((pkg) => (
            <motion.div
              key={pkg.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className={`glass-effect border-white/20 cursor-pointer hover:border-purple-500/50 transition-all duration-300 relative ${pkg.popular ? 'ring-2 ring-purple-500' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{pkg.coins}</h3>
                  <p className="text-3xl font-bold text-white mt-2">${pkg.price}</p>
                  <Button
                    onClick={() => purchaseCoins(pkg.id)}
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-semibold"
                  >
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoinRechargeModal;