import { redirect } from 'next/navigation';

export default async function LabMarkerRoute({ params }: { params: Promise<{ reportId: string; markerId: string }> }) {
  const { reportId, markerId } = await params;
  redirect(`/labs?view=detail&report=${encodeURIComponent(reportId)}&marker=${encodeURIComponent(markerId)}`);
}
