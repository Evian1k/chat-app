import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Video, Users, Coins, Shield, Globe, Heart, Zap } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageCircle,
      title: "Real-time Chat",
      description: "Instant messaging with emojis, photos, and voice messages"
    },
    {
      icon: Video,
      title: "Video & Voice Calls",
      description: "High-quality video and voice calls with WebRTC technology"
    },
    {
      icon: Users,
      title: "AI Matching",
      description: "Smart AI matches you with people based on your interests"
    },
    {
      icon: Coins,
      title: "Coin System",
      description: "Earn and spend coins for premium features and interactions"
    },
    {
      icon: Globe,
      title: "Multi-language",
      description: "Auto-translate messages to connect with people worldwide"
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Advanced privacy controls and user verification system"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <Helmet>
        <title>SocialChat - Connect, Chat, Video Call Globally</title>
        <meta name="description" content="Join SocialChat for real-time messaging, AI-powered matching, video calls, and global connections. Meet new people safely with our coin-based premium features." />
      </Helmet>

      <div className="aurora-bg" />

      <section className="relative py-20 px-4">
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full blur-2xl opacity-60" />
                <div className="relative bg-black/30 backdrop-blur-sm rounded-full p-6 border border-white/20">
                  <Heart className="w-16 h-16 text-fuchsia-400" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
              Connect Beyond
              <br />
              <span className="text-4xl md:text-6xl">The Horizon</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-3xl mx-auto">
              Step into the future of social connection. AI-powered matching, real-time chat, and a global community await.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg shadow-purple-500/20 transform hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/register')}
              >
                <Zap className="w-5 h-5 mr-2" />
                Join The Future
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-full backdrop-blur-sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              An Advanced Social Experience
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Engineered with cutting-edge features to forge genuine connections in the digital universe.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="glass-effect border-white/10 hover:border-purple-500/50 transition-all duration-300 group h-full">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-3 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                    <p className="text-white/60">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">10M+</div>
              <div className="text-white/60">Souls Connected</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">50+</div>
              <div className="text-white/60">Languages Spoken</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
              <div className="text-white/60">Uptime</div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transcend?
            </h2>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Your next great conversation is written in the stars. Join millions and find your connection.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/register')}
            >
              <Heart className="w-6 h-6 mr-3" />
              Begin Your Journey
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;