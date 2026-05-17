"use client";

import { HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface InfoPopoverProps {
  title: string;
  content: string;
}

export function InfoPopover({ title, content }: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 text-muted-foreground hover:text-foreground"
          aria-label={`Info about ${title}`}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" side="top">
        <div className="space-y-2">
          <h4 className="font-medium">{title}</h4>
          <p className="text-muted-foreground leading-relaxed">{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
