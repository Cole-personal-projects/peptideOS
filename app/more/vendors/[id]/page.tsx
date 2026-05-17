"use client";

import { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Building2, FileText, FlaskConical } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context';

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getVendor, getPeptide, data } = useApp();
  const vendor = getVendor(id);

  if (!vendor) {
    notFound();
  }

  // Get vials from this vendor
  const vendorVials = data.vials.filter(v => v.vendor === vendor.id);

  return (
    <AppShell>
      <PageHeader title={vendor.name} backHref="/more/vendors" />

      <div className="p-4 space-y-4">
        {/* Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg">{vendor.name}</h3>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Private Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {vendor.privateNotes || 'No notes added'}
            </p>
          </CardContent>
        </Card>

        {/* Purchased Peptides */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              Purchased Peptides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {vendor.peptidesPurchased.map((peptideId) => {
                const peptide = getPeptide(peptideId);
                return (
                  <Link key={peptideId} href={`/library/${peptideId}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {peptide?.name}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Vials from vendor */}
        {vendorVials.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vials from {vendor.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {vendorVials.map((vial) => {
                const peptide = getPeptide(vial.peptideId);
                return (
                  <Link key={vial.id} href={`/more/inventory/${vial.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{peptide?.name}</p>
                        <p className="text-xs text-muted-foreground">{vial.lotNumber}</p>
                      </div>
                      <Badge variant={vial.status === 'active' ? 'default' : 'secondary'} className="capitalize text-xs">
                        {vial.status}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
