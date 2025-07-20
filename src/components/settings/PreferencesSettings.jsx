import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Volume2, Smartphone } from 'lucide-react';

const PreferencesSettings = ({ settings, updateSetting, languages }) => {
  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          App Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-white font-medium">Language</label>
          <Select
            value={settings.language}
            onValueChange={(value) => updateSetting('preferences', 'language', value)}
          >
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-white font-medium">Sound Effects</p>
              <p className="text-white/70 text-sm">Play sounds for notifications</p>
            </div>
          </div>
          <Switch
            checked={settings.soundEffects}
            onCheckedChange={(checked) => updateSetting('preferences', 'soundEffects', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-white font-medium">Vibration</p>
              <p className="text-white/70 text-sm">Vibrate for notifications</p>
            </div>
          </div>
          <Switch
            checked={settings.vibration}
            onCheckedChange={(checked) => updateSetting('preferences', 'vibration', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-white font-medium">Auto-translate</p>
              <p className="text-white/70 text-sm">Automatically translate messages</p>
            </div>
          </div>
          <Switch
            checked={settings.autoTranslate}
            onCheckedChange={(checked) => updateSetting('preferences', 'autoTranslate', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesSettings;