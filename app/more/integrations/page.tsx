import Image from 'next/image';
import { Heart } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const integrations = [
  { 
    name: 'Apple Health', 
    description: 'Sync health metrics and activity data',
    status: 'coming-soon',
    logo: '/apple-health.svg'
  },
  { 
    name: 'Whoop', 
    description: 'Import recovery, strain, and sleep data',
    status: 'coming-soon',
    logo: '/whoop.svg'
  },
  { 
    name: 'Oura', 
    description: 'Track sleep quality and readiness scores',
    status: 'coming-soon',
    logo: '/oura.svg'
  },
];

export default function IntegrationsPage() {
  return (
    <AppShell>
      <PageHeader title="Health Integrations" backHref="/more" />

      <div className="p-4 space-y-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Connect Your Health Data</p>
                <p className="text-xs text-muted-foreground">
                  Sync with wearables to correlate protocols with outcomes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Available Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                    <Heart className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[11px]">
                  Soon
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center px-4">
          Health integrations will allow you to correlate your peptide protocols with biometric data for better insights.
        </p>
      </div>
    </AppShell>
  );
}
