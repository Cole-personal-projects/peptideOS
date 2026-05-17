"use client";

import Link from 'next/link';
import { Plus, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';

export default function VendorsPage() {
  const { data, getPeptide } = useApp();

  return (
    <AppShell>
      <PageHeader 
        title="Vendors" 
        backHref="/more"
        rightElement={
          <Button size="sm" variant="ghost" className="text-primary">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        }
      />

      <div className="p-4 space-y-3">
        {data.vendors.length === 0 ? (
          <Card className="bg-secondary/50 border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-2">No vendors added yet</p>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Vendor
              </Button>
            </CardContent>
          </Card>
        ) : (
          data.vendors.map((vendor) => (
            <Link key={vendor.id} href={`/more/vendors/${vendor.id}`}>
              <Card className="hover:bg-secondary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{vendor.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {vendor.privateNotes}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {vendor.peptidesPurchased.slice(0, 4).map((peptideId) => {
                          const peptide = getPeptide(peptideId);
                          return (
                            <Badge key={peptideId} variant="outline" className="text-[10px]">
                              {peptide?.name}
                            </Badge>
                          );
                        })}
                        {vendor.peptidesPurchased.length > 4 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{vendor.peptidesPurchased.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
