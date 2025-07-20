import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, MessageCircle, Heart, Video, Smartphone } from 'lucide-react';

const NotificationsSettings = ({ settings, updateSetting }) => {
  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-white font-medium">New Messages</p>
              <p className="text-white/70 text-sm">Get notified of new messages</p>
            </div>
          </div>
          <Switch
            checked={settings.messages}
            onCheckedChange={(checked) => updateSetting('notifications', 'messages', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-pink-500" />
            <div>
              <p className="text-white font-medium">New Matches</p>
              <p className="text-white/70 text-sm">Get notified of new matches</p>
            </div>
          </div>
          <Switch
            checked={settings.matches}
            onCheckedChange={(checked) => updateSetting('notifications', 'matches', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-white font-medium">Likes</p>
              <p className="text-white/70 text-sm">Get notified when someone likes you</p>
            </div>
          </div>
          <Switch
            checked={settings.likes}
            onCheckedChange={(checked) => updateSetting('notifications', 'likes', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-white font-medium">Calls</p>
              <p className="text-white/70 text-sm">Get notified of incoming calls</p>
            </div>
          </div>
          <Switch
            checked={settings.calls}
            onCheckedChange={(checked) => updateSetting('notifications', 'calls', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-cyan-500" />
            <div>
              <p className="text-white font-medium">Push Notifications</p>
              <p className="text-white/70 text-sm">Receive push notifications</p>
            </div>
          </div>
          <Switch
            checked={settings.push}
            onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsSettings;