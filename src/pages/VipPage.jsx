import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Crown, Zap, Gift, Shield, Ghost, Star } from 'lucide-react';

const VipPage = () => {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState('monthly');

    const features = [
        { icon: Crown, text: 'VIP Badge on Profile' },
        { icon: Zap, text: '5 Free Super Likes Daily' },
        { icon: Gift, text: 'Monthly Coin Bonus (300 coins)' },
        { icon: Shield, text: 'See who liked you' },
        { icon: Ghost, text: 'Incognito Mode' },
        { icon: Star, text: 'Profile Boost once a week' },
    ];
    
    const plans = {
        monthly: { price: 9.99, period: 'month' },
        yearly: { price: 59.99, period: 'year', discount: '50%' },
        lifetime: { price: 199.99, period: 'lifetime' }
    };

    return (
        <div className="min-h-screen bg-transparent p-4">
            <Helmet>
                <title>Go VIP - SocialChat</title>
                <meta name="description" content="Upgrade to VIP for exclusive features like unlimited swipes, profile boosts, and more on SocialChat." />
            </Helmet>
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Crown className="text-yellow-400" /> Go VIP</h1>
                </header>

                <div className="grid lg:grid-cols-2 gap-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <Card className="glass-effect border-yellow-500/30 h-full">
                            <CardHeader>
                                <CardTitle className="text-2xl text-white">Unlock Exclusive Features</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full">
                                            <feature.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-white/90">{feature.text}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="glass-effect border-white/20">
                            <CardHeader>
                                <CardTitle className="text-2xl text-white text-center">Choose Your Plan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-center gap-2 p-1 bg-black/30 rounded-full">
                                    <Button onClick={() => setSelectedPlan('monthly')} className={`flex-1 rounded-full ${selectedPlan === 'monthly' ? 'bg-purple-600' : 'bg-transparent text-white/70'}`}>Monthly</Button>
                                    <Button onClick={() => setSelectedPlan('yearly')} className={`flex-1 rounded-full relative ${selectedPlan === 'yearly' ? 'bg-purple-600' : 'bg-transparent text-white/70'}`}>Yearly <span className="absolute -top-2 right-0 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">Save 50%</span></Button>
                                    <Button onClick={() => setSelectedPlan('lifetime')} className={`flex-1 rounded-full ${selectedPlan === 'lifetime' ? 'bg-purple-600' : 'bg-transparent text-white/70'}`}>Lifetime</Button>
                                </div>

                                <div className="text-center py-6">
                                    <p className="text-5xl font-bold text-white">${plans[selectedPlan].price}</p>
                                    <p className="text-white/70">per {plans[selectedPlan].period}</p>
                                </div>
                                
                                <Button className="w-full py-6 text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-500 hover:opacity-90 text-black">
                                    Upgrade to VIP
                                </Button>
                                <p className="text-xs text-white/50 text-center">Payments are handled securely. You can cancel anytime.</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default VipPage;