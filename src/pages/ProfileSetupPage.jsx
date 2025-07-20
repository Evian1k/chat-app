
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Plus, X, Heart, Globe } from 'lucide-react';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [language, setLanguage] = useState('en');
  const [bio, setBio] = useState('');

  const popularInterests = [
    'Technology', 'Travel', 'Music', 'Movies', 'Sports', 'Art', 'Cooking', 'Reading',
    'Gaming', 'Photography', 'Fitness', 'Dancing', 'Nature', 'Fashion', 'Science', 'History'
  ];

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

  const addInterest = (interest) => {
    if (!interests.includes(interest) && interests.length < 10) {
      setInterests([...interests, interest]);
    }
  };

  const removeInterest = (interest) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleAddCustomInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      addInterest(newInterest.trim());
      setNewInterest('');
    }
  };

  const handleComplete = () => {
    updateProfile({
      interests,
      language,
      bio,
      profileComplete: true
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Helmet>
        <title>Complete Your Profile - SocialChat</title>
        <meta name="description" content="Complete your SocialChat profile by adding interests, language preferences, and bio to get better AI-powered matches." />
      </Helmet>

      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                  <Heart className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Complete Your Profile</CardTitle>
              <p className="text-white/70">Help us find your perfect matches with AI-powered recommendations</p>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Profile Photo */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <img  alt="Profile avatar" className="w-24 h-24 rounded-full object-cover" src="https://images.unsplash.com/photo-1614959652319-6299f514328d" />
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-white/70 text-sm mt-2">Upload your profile photo</p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Bio</label>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-24 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-white/50">{bio.length}/200 characters</p>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Primary Language
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white/80">Interests</label>
                  <p className="text-xs text-white/50">Select up to 10 interests to help us find your perfect matches</p>
                </div>

                {/* Selected Interests */}
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="secondary"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-3 py-1"
                      >
                        {interest}
                        <button
                          onClick={() => removeInterest(interest)}
                          className="ml-2 hover:text-white/70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Popular Interests */}
                <div>
                  <p className="text-sm text-white/70 mb-2">Popular interests:</p>
                  <div className="flex flex-wrap gap-2">
                    {popularInterests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="outline"
                        className={`cursor-pointer border-white/30 text-white hover:bg-white/10 ${
                          interests.includes(interest) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => !interests.includes(interest) && addInterest(interest)}
                      >
                        {interest}
                        {!interests.includes(interest) && <Plus className="w-3 h-3 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Custom Interest */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom interest..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomInterest()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    disabled={interests.length >= 10}
                  />
                  <Button
                    onClick={handleAddCustomInterest}
                    disabled={!newInterest.trim() || interests.length >= 10}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Complete Button */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                >
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
