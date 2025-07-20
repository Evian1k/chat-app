
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  Coins, 
  TrendingUp,
  Shield,
  Flag,
  Settings,
  BarChart3,
  DollarSign,
  Crown,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock admin data
  const stats = {
    totalUsers: 10247,
    activeUsers: 8532,
    totalMessages: 156789,
    totalRevenue: 45678,
    reportsToday: 12,
    newUsersToday: 234
  };

  const recentReports = [
    {
      id: 1,
      reportedUser: 'John Doe',
      reportedBy: 'Jane Smith',
      reason: 'Inappropriate content',
      status: 'pending',
      timestamp: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      reportedUser: 'Mike Johnson',
      reportedBy: 'Sarah Wilson',
      reason: 'Harassment',
      status: 'resolved',
      timestamp: '2024-01-15T09:15:00Z'
    }
  ];

  const topUsers = [
    {
      id: 1,
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      messages: 1234,
      coins: 5000,
      status: 'verified'
    },
    {
      id: 2,
      name: 'Bob Smith',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      messages: 987,
      coins: 3500,
      status: 'active'
    }
  ];

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen p-4">
      <Helmet>
        <title>Admin Dashboard - SocialChat</title>
        <meta name="description" content="SocialChat admin dashboard for managing users, reports, analytics, and system settings." />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-white/70">Manage your SocialChat platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-red-500 text-white">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {stats.reportsToday} Reports
            </Badge>
            <Button
              variant="outline"
              size="icon"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <Card className="glass-effect border-white/20">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-white/70 text-sm">Total Users</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.activeUsers.toLocaleString()}</div>
              <div className="text-white/70 text-sm">Active Users</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalMessages.toLocaleString()}</div>
              <div className="text-white/70 text-sm">Messages</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</div>
              <div className="text-white/70 text-sm">Revenue</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
            <CardContent className="p-4 text-center">
              <Flag className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.reportsToday}</div>
              <div className="text-white/70 text-sm">Reports Today</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.newUsersToday}</div>
              <div className="text-white/70 text-sm">New Today</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/10 border border-white/20">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-white/20">
                Users
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-white/20">
                Reports
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white/20">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Reports */}
                <Card className="glass-effect border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Flag className="w-5 h-5" />
                      Recent Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentReports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                          <div>
                            <p className="text-white font-medium">{report.reportedUser}</p>
                            <p className="text-white/70 text-sm">{report.reason}</p>
                            <p className="text-white/50 text-xs">
                              Reported by {report.reportedBy}
                            </p>
                          </div>
                          <Badge className={
                            report.status === 'pending' 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-green-500 text-white'
                          }>
                            {report.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Users */}
                <Card className="glass-effect border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Top Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-white">{user.name}</h4>
                              {user.status === 'verified' && (
                                <Shield className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <div className="flex gap-4 text-sm text-white/70">
                              <span>{user.messages} messages</span>
                              <span>{user.coins} coins</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/70">User management features coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Report Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Flag className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/70">Report management features coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Analytics & Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/70">Analytics dashboard coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/70">System settings coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
