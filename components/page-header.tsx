import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  backHref?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, backHref, rightElement, className }: PageHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border", className)}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {backHref && (
            <Button variant="ghost" size="icon" asChild className="-ml-2">
              <Link href={backHref}>
                <ChevronLeft className="w-5 h-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {rightElement && <div>{rightElement}</div>}
      </div>
    </header>
  );
}
