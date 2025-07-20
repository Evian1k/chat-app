import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

const DiscoverySettings = ({ settings, updateSetting }) => {
  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Discovery Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-white font-medium">Age Range</label>
          <Slider
            value={settings.ageRange}
            onValueChange={(value) => updateSetting('discovery', 'ageRange', value)}
            max={60}
            min={18}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-white/70">
            <span>{settings.ageRange[0]} years</span>
            <span>{settings.ageRange[1]} years</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-white font-medium">Maximum Distance</label>
          <Slider
            value={[settings.maxDistance]}
            onValueChange={(value) => updateSetting('discovery', 'maxDistance', value[0])}
            max={100}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="text-sm text-white/70">
            {settings.maxDistance} km
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-white font-medium">Show me</label>
          <Select
            value={settings.showMe}
            onValueChange={(value) => updateSetting('discovery', 'showMe', value)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscoverySettings;