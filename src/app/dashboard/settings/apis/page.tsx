import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { apiRegistry } from '@/services/api-registry';

export default function APIConfigurationPage() {
  const platforms = Array.from(new Set([
    ...apiRegistry.getAvailablePlatforms(),
    'youtube',
    'hackernews',
    'newsapi',
    'mastodon',
    'telegram',
    'discord'
  ]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configuration des APIs</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings">Retour aux paramètres</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((key) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-xl">{iconFor(key)}</span>
                  {labelFor(key)}
                </span>
                <Badge variant="secondary">{registered(key) ? 'Connecté' : 'Non configuré'}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requiredKeysFor(key).map(k => (
                <div key={k}>
                  <Label>{k}</Label>
                  <Input type="password" placeholder={`Votre ${k}`} />
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Tester la connexion</Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={guideFor(key)} target="_blank" rel="noreferrer">📖 Guide</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function registered(key: string): boolean {
  return apiRegistry.getAvailablePlatforms().includes(key);
}

function labelFor(key: string): string {
  switch (key) {
    case 'reddit': return 'Reddit';
    case 'facebook': return 'Facebook';
    case 'youtube': return 'YouTube';
    case 'hackernews': return 'Hacker News';
    case 'newsapi': return 'News API';
    case 'mastodon': return 'Mastodon';
    case 'telegram': return 'Telegram';
    case 'discord': return 'Discord';
    default: return key;
  }
}

function iconFor(key: string): string {
  switch (key) {
    case 'reddit': return '🤖';
    case 'facebook': return '📘';
    case 'youtube': return '📺';
    case 'hackernews': return '🟠';
    case 'newsapi': return '📰';
    case 'mastodon': return '🐘';
    case 'telegram': return '✈️';
    case 'discord': return '💬';
    default: return '🔌';
  }
}

function requiredKeysFor(key: string): string[] {
  switch (key) {
    case 'reddit': return ['REDDIT_CLIENT_ID','REDDIT_CLIENT_SECRET'];
    case 'facebook': return ['FACEBOOK_APP_ID','FACEBOOK_ACCESS_TOKEN'];
    case 'youtube': return ['YOUTUBE_API_KEY'];
    case 'hackernews': return [];
    case 'newsapi': return ['NEWS_API_KEY'];
    case 'mastodon': return ['MASTODON_INSTANCE_URL'];
    case 'telegram': return ['TELEGRAM_BOT_TOKEN'];
    case 'discord': return ['DISCORD_BOT_TOKEN'];
    default: return [];
  }
}

function guideFor(key: string): string {
  switch (key) {
    case 'reddit': return 'https://www.reddit.com/prefs/apps';
    case 'facebook': return 'https://developers.facebook.com/';
    case 'youtube': return 'https://console.cloud.google.com/';
    case 'hackernews': return 'https://hn.algolia.com/api';
    case 'newsapi': return 'https://newsapi.org/register';
    case 'mastodon': return 'https://joinmastodon.org/servers';
    case 'telegram': return 'https://core.telegram.org/bots#how-do-i-create-a-bot';
    case 'discord': return 'https://discord.com/developers/applications';
    default: return '#';
  }
}


