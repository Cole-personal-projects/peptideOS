import { TestTube, Plus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LabResultsPage() {
  return (
    <AppShell>
      <PageHeader title="Lab Results" backHref="/more" />

      <div className="p-4">
        <Card className="bg-secondary/30 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <TestTube className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Lab Results Coming Soon</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Track your bloodwork and monitor biomarkers over time to optimize your research protocols.
            </p>
            <Button variant="outline" disabled>
              <Plus className="w-4 h-4 mr-2" />
              Add Lab Results
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
