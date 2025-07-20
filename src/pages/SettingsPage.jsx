import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import NotificationsSettings from '@/components/settings/NotificationsSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import PreferencesSettings from '@/components/settings/PreferencesSettings';
import DiscoverySettings from '@/components/settings/DiscoverySettings';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      messages: true,
      matches: true,
      likes: true,
      calls: true,
      push: true,
      email: false
    },
    privacy: {
      showOnline: true,
      showDistance: true,
      showAge: true,
      allowMessages: 'everyone',
      allowCalls: 'matches'
    },
    preferences: {
      language: 'en',
      theme: 'dark',
      soundEffects: true,
      vibration: true,
      autoTranslate: true
    },
    discovery: {
      ageRange: [18, 35],
      maxDistance: 50,
      showMe: 'everyone'
    }
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ];

  const motionProps = (delay) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay }
  });

  return (
    <div className="min-h-screen p-4">
      <Helmet>
        <title>Settings - SocialChat</title>
        <meta name="description" content="Customize your SocialChat experience with privacy, notification, and discovery settings." />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-white/70">Customize your SocialChat experience</p>
          </div>
        </div>

        <motion.div {...motionProps(0)}>
          <NotificationsSettings settings={settings.notifications} updateSetting={updateSetting} />
        </motion.div>

        <motion.div {...motionProps(0.1)}>
          <PrivacySettings settings={settings.privacy} updateSetting={updateSetting} />
        </motion.div>

        <motion.div {...motionProps(0.2)}>
          <PreferencesSettings settings={settings.preferences} updateSetting={updateSetting} languages={languages} />
        </motion.div>

        <motion.div {...motionProps(0.3)}>
          <DiscoverySettings settings={settings.discovery} updateSetting={updateSetting} />
        </motion.div>

        <motion.div {...motionProps(0.4)} className="text-center">
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3"
            onClick={() => {
              updateProfile({ settings });
              navigate('/dashboard');
            }}
          >
            Save Settings
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;