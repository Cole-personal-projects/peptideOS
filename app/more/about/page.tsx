import { AlertTriangle, Shield, FileText, Mail } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
  return (
    <AppShell>
      <PageHeader title="About" backHref="/more" />

      <div className="p-4 space-y-4">
        {/* App Info */}
        <div className="text-center py-6">
          <h1 className="text-xl font-bold">PeptideOS</h1>
          <p className="text-muted-foreground text-sm mt-1">Version 1.0.0</p>
          <p className="text-xs text-muted-foreground mt-0.5">Personal Peptide Research Tracking</p>
        </div>

        {/* Research Disclaimer */}
        <Alert className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Research Purposes Only</AlertTitle>
          <AlertDescription className="text-sm mt-2">
            PeptideOS is designed exclusively for tracking research compounds. This application 
            does not provide medical advice, diagnosis, or treatment recommendations. All peptides 
            tracked in this app are for legitimate research purposes only.
          </AlertDescription>
        </Alert>

        {/* Legal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Disclaimers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Not Medical Advice:</strong> The information provided 
              in this application is for informational and research purposes only. It is not intended 
              to be a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <Separator />
            <p>
              <strong className="text-foreground">Consult Professionals:</strong> Always seek the advice 
              of your physician or other qualified health provider with any questions you may have 
              regarding a medical condition or treatment.
            </p>
            <Separator />
            <p>
              <strong className="text-foreground">Research Use:</strong> Peptides tracked in this application 
              are intended for research purposes only and not for human consumption unless prescribed by 
              a licensed medical professional.
            </p>
            <Separator />
            <p>
              <strong className="text-foreground">No Liability:</strong> The developers of PeptideOS 
              assume no liability for any actions taken based on the information provided in this 
              application.
            </p>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors">
              <p className="font-medium text-sm">Privacy Policy</p>
              <p className="text-xs text-muted-foreground">How we handle your data</p>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors">
              <p className="font-medium text-sm">Terms of Service</p>
              <p className="text-xs text-muted-foreground">Usage terms and conditions</p>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors">
              <p className="font-medium text-sm">Research Guidelines</p>
              <p className="text-xs text-muted-foreground">Best practices for tracking</p>
            </button>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              For questions, feedback, or support, please contact us at{' '}
              <span className="text-primary">support@peptideos.app</span>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground py-4">
          Made with care for the research community
        </p>
      </div>
    </AppShell>
  );
}
