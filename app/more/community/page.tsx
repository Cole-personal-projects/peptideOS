import { Users, MessageSquare } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CommunityPage() {
  return (
    <AppShell>
      <PageHeader title="Community" backHref="/more" />

      <div className="p-4">
        <Card className="bg-secondary/30 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Community Coming Soon</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Connect with fellow researchers to share protocols, experiences, and insights.
            </p>
            <Button variant="outline" disabled>
              <MessageSquare className="w-4 h-4 mr-2" />
              Join Waitlist
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
