import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';

const PrivacySettings = ({ settings, updateSetting }) => {
  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & Safety
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Show Online Status</p>
            <p className="text-white/70 text-sm">Let others see when you're online</p>
          </div>
          <Switch
            checked={settings.showOnline}
            onCheckedChange={(checked) => updateSetting('privacy', 'showOnline', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Show Distance</p>
            <p className="text-white/70 text-sm">Display your distance to others</p>
          </div>
          <Switch
            checked={settings.showDistance}
            onCheckedChange={(checked) => updateSetting('privacy', 'showDistance', checked)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-white font-medium">Who can message you</label>
          <Select
            value={settings.allowMessages}
            onValueChange={(value) => updateSetting('privacy', 'allowMessages', value)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="matches">Matches only</SelectItem>
              <SelectItem value="verified">Verified users only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-white font-medium">Who can call you</label>
          <Select
            value={settings.allowCalls}
            onValueChange={(value) => updateSetting('privacy', 'allowCalls', value)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="matches">Matches only</SelectItem>
              <SelectItem value="none">No one</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;