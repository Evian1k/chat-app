import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Coins, Rocket, CheckCircle, Target, Gift } from 'lucide-react';
import { useCoin } from '@/contexts/CoinContext';

const MissionsPage = () => {
    const navigate = useNavigate();
    const { earnCoins } = useCoin();
    const [missions, setMissions] = useState([
        { id: 1, title: 'Profile Pro', description: 'Complete your profile to 100%', reward: 50, completed: false, progress: 80 },
        { id: 2, title: 'Conversation Starter', description: 'Start 5 new chats', reward: 20, completed: false, progress: 60 },
        { id: 3, title: 'Social Butterfly', description: 'Chat for 30 minutes in total', reward: 30, completed: false, progress: 33 },
        { id: 4, title: 'Daily Login Streak', description: 'Login for 7 consecutive days', reward: 100, completed: false, progress: 14 },
    ]);

    const handleClaim = (mission) => {
        earnCoins(mission.reward, `Mission: ${mission.title}`);
        setMissions(missions.map(m => m.id === mission.id ? { ...m, claimed: true } : m));
    };

    return (
        <div className="min-h-screen bg-transparent p-4">
            <Helmet>
                <title>Missions - SocialChat</title>
                <meta name="description" content="Complete missions to earn free coins and rewards on SocialChat." />
            </Helmet>
            <div className="max-w-2xl mx-auto">
                <header className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Rocket /> Missions</h1>
                </header>

                <div className="space-y-4">
                    {missions.map((mission, index) => (
                        <motion.div key={mission.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Card className="glass-effect border-white/20">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg">
                                            {mission.completed ? <CheckCircle className="w-6 h-6 text-white" /> : <Target className="w-6 h-6 text-white" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{mission.title}</h3>
                                            <p className="text-sm text-white/70">{mission.description}</p>
                                            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                                <div className="bg-gradient-to-r from-teal-400 to-cyan-400 h-2.5 rounded-full" style={{ width: `${mission.progress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1.5 font-bold text-yellow-400 mb-2">
                                            <Coins className="w-5 h-5" /> {mission.reward}
                                        </div>
                                        {mission.progress === 100 && !mission.claimed ? (
                                            <Button onClick={() => handleClaim(mission)} className="bg-gradient-to-r from-teal-500 to-cyan-500">Claim</Button>
                                        ) : mission.claimed ? (
                                            <span className="text-green-400 text-sm">Claimed</span>
                                        ) : (
                                            <Button variant="outline" disabled className="border-white/20 text-white/50">{mission.progress}%</Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
                
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
                    <Card className="glass-effect border-purple-500/30">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2"><Gift /> Daily Rewards</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <p className="text-white/80">Don't forget to claim your daily login bonus!</p>
                            <Button onClick={() => navigate('/rewards')} className="bg-gradient-to-r from-purple-500 to-pink-500">Claim Now</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default MissionsPage;