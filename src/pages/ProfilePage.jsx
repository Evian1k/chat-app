
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Camera, 
  Edit, 
  MapPin, 
  Calendar, 
  Globe, 
  Heart,
  Crown,
  Shield,
  Plus,
  X,
  Save
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    age: user?.age || '',
    interests: user?.interests || [],
    language: user?.language || 'en'
  });
  const [newInterest, setNewInterest] = useState('');

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

  const popularInterests = [
    'Technology', 'Travel', 'Music', 'Movies', 'Sports', 'Art', 'Cooking', 'Reading',
    'Gaming', 'Photography', 'Fitness', 'Dancing', 'Nature', 'Fashion', 'Science', 'History'
  ];

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const addInterest = (interest) => {
    if (!formData.interests.includes(interest) && formData.interests.length < 10) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
  };

  const removeInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  const handleAddCustomInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      addInterest(newInterest.trim());
      setNewInterest('');
    }
  };

  return (
    <div className="min-h-screen p-4">
      <Helmet>
        <title>My Profile - SocialChat</title>
        <meta name="description" content="Manage your SocialChat profile, update interests, bio, and preferences to get better matches." />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
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

          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-effect border-white/20">
            <CardContent className="p-6">
              {/* Profile Photo & Basic Info */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <Avatar className="w-32 h-32 border-4 border-purple-500">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                      {user.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30 hover:bg-white/30 transition-colors">
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  )}
                  {user.isVerified && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-yellow-500 rounded-full p-2">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="text-center text-2xl font-bold bg-white/10 border-white/20 text-white"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                      {user.name}
                      {user.isVerified && <Shield className="w-5 h-5 text-green-500" />}
                    </h1>
                  )}
                  
                  <div className="flex items-center justify-center gap-4 mt-2 text-white/70">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {isEditing ? (
                        <Input
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: e.target.value})}
                          className="w-16 text-center bg-white/10 border-white/20 text-white"
                          min="18"
                          max="100"
                        />
                      ) : (
                        <span>{user.age}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {isEditing ? (
                        <Input
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-32 bg-white/10 border-white/20 text-white"
                          placeholder="Location"
                        />
                      ) : (
                        <span>{user.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">About Me</h3>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    className="w-full h-24 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 resize-none"
                    maxLength={200}
                  />
                ) : (
                  <p className="text-white/80">{user.bio || 'No bio added yet.'}</p>
                )}
              </div>

              {/* Language */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language
                </h3>
                {isEditing ? (
                  <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
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
                ) : (
                  <p className="text-white/80">
                    {languages.find(l => l.code === user.language)?.name || 'English'}
                  </p>
                )}
              </div>

              {/* Interests */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Interests
                </h3>

                {/* Current Interests */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(isEditing ? formData.interests : user.interests || []).map((interest) => (
                    <Badge
                      key={interest}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-3 py-1"
                    >
                      {interest}
                      {isEditing && (
                        <button
                          onClick={() => removeInterest(interest)}
                          className="ml-2 hover:text-white/70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>

                {isEditing && (
                  <>
                    {/* Popular Interests */}
                    <div className="mb-4">
                      <p className="text-sm text-white/70 mb-2">Add from popular:</p>
                      <div className="flex flex-wrap gap-2">
                        {popularInterests.map((interest) => (
                          <Badge
                            key={interest}
                            variant="outline"
                            className={`cursor-pointer border-white/30 text-white hover:bg-white/10 ${
                              formData.interests.includes(interest) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => !formData.interests.includes(interest) && addInterest(interest)}
                          >
                            {interest}
                            {!formData.interests.includes(interest) && <Plus className="w-3 h-3 ml-1" />}
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
                        disabled={formData.interests.length >= 10}
                      />
                      <Button
                        onClick={handleAddCustomInterest}
                        disabled={!newInterest.trim() || formData.interests.length >= 10}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      {formData.interests.length}/10 interests
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Profile Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">42</div>
                  <div className="text-white/70 text-sm">Profile Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">8</div>
                  <div className="text-white/70 text-sm">Matches</div>
                </div>
                <div className="text-2xl font-bold text-white text-center">
                  <div className="text-2xl font-bold text-white">{user.coins}</div>
                  <div className="text-white/70 text-sm">Coins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">15</div>
                  <div className="text-white/70 text-sm">Conversations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
