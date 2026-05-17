import { Bot, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AIAssistantPage() {
  return (
    <AppShell>
      <PageHeader title="AI Assistant" backHref="/more" />

      <div className="p-4">
        <Card className="bg-secondary/30 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI Research Assistant</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Get AI-powered insights on your protocols, answer research questions, and optimize your stacks.
            </p>
            <Button variant="outline" disabled>
              <Sparkles className="w-4 h-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
