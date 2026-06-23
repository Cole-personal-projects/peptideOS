import { redirect } from 'next/navigation';

export default function LabsTrendsRoute() {
  redirect('/labs?view=trends');
}
