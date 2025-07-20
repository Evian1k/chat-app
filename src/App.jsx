import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { CoinProvider } from '@/contexts/CoinContext';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProfileSetupPage from '@/pages/ProfileSetupPage';
import DashboardPage from '@/pages/DashboardPage';
import MatchingPage from '@/pages/MatchingPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage.jsx';
import CoinStorePage from '@/pages/CoinStorePage';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import VideoCallPage from '@/pages/VideoCallPage';
import DailyRewardPage from '@/pages/DailyRewardPage';
import ShimmerLoader from '@/components/ShimmerLoader';
import MomentsPage from '@/pages/MomentsPage';
import MissionsPage from '@/pages/MissionsPage';
import VipPage from '@/pages/VipPage';
import { AnimatePresence } from 'framer-motion';

function App() {
  return (
    <AuthProvider>
      <CoinProvider>
        <ChatProvider>
          <Router>
            <div className="min-h-screen bg-[#0A0A0A] selection:bg-purple-500/30">
              <div className="aurora-bg" />
              <Helmet>
                <title>SocialChat - Connect, Chat, Video Call</title>
                <meta name="description" content="Real-time social chat app with AI matching, video calls, and global connections. Meet new people, chat instantly, and build meaningful relationships." />
              </Helmet>
              
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/profile-setup" element={<ProfileSetupPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/matching" element={<MatchingPage />} />
                  <Route path="/chat/:userId?" element={<ChatPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/coins" element={<CoinStorePage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/call/:userId" element={<VideoCallPage />} />
                  <Route path="/rewards" element={<DailyRewardPage />} />
                  <Route path="/moments" element={<MomentsPage />} />
                  <Route path="/missions" element={<MissionsPage />} />
                  <Route path="/vip" element={<VipPage />} />
                  <Route path="/loader" element={<ShimmerLoader />} />
                </Routes>
              </AnimatePresence>
              
              <Toaster />
            </div>
          </Router>
        </ChatProvider>
      </CoinProvider>
    </AuthProvider>
  );
}

export default App;