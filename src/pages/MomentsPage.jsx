import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Camera, Heart, MessageCircle, Send } from 'lucide-react';

const MomentsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [moments, setMoments] = useState([
        { id: 1, user: { name: 'Alice', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' }, text: 'Enjoying the sunset view! 🌅', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b', likes: 25, comments: 4 },
        { id: 2, user: { name: 'Emma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' }, text: 'New art piece in the making. What do you guys think?', image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968', likes: 52, comments: 12 },
    ]);
    const [newMoment, setNewMoment] = useState('');

    const handlePostMoment = () => {
        if (!newMoment.trim()) return;
        const moment = {
            id: Date.now(),
            user: { name: user.name, avatar: user.avatar },
            text: newMoment,
            image: null,
            likes: 0,
            comments: 0
        };
        setMoments([moment, ...moments]);
        setNewMoment('');
    };

    return (
        <div className="min-h-screen bg-transparent p-4">
            <Helmet>
                <title>Moments - SocialChat</title>
                <meta name="description" content="Share your life moments and connect with the global community on SocialChat." />
            </Helmet>
            
            <div className="max-w-2xl mx-auto">
                <header className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold text-white">Moments</h1>
                </header>

                <Card className="glass-effect border-white/20 mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            <Avatar><AvatarImage src={user?.avatar} /><AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback></Avatar>
                            <div className="w-full">
                                <Textarea
                                    value={newMoment}
                                    onChange={(e) => setNewMoment(e.target.value)}
                                    placeholder="What's on your mind?"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none h-24 mb-2"
                                />
                                <div className="flex justify-between items-center">
                                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white"><Camera /></Button>
                                    <Button onClick={handlePostMoment} className="bg-gradient-to-r from-purple-500 to-pink-500">
                                        <Send className="w-4 h-4 mr-2" /> Post
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {moments.map((moment) => (
                        <motion.div key={moment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="glass-effect border-white/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar><AvatarImage src={moment.user.avatar} /><AvatarFallback>{moment.user.name.charAt(0)}</AvatarFallback></Avatar>
                                        <p className="font-semibold text-white">{moment.user.name}</p>
                                    </div>
                                    <p className="text-white/90 mb-3">{moment.text}</p>
                                    {moment.image && (
                                        <div className="rounded-lg overflow-hidden mb-3">
                                            <img src={moment.image} alt="Moment" className="w-full h-auto object-cover" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 text-white/70">
                                        <button className="flex items-center gap-1.5 hover:text-pink-400 transition-colors"><Heart className="w-5 h-5" /> {moment.likes}</button>
                                        <button className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"><MessageCircle className="w-5 h-5" /> {moment.comments}</button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MomentsPage;