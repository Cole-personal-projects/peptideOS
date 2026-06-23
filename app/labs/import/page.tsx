import { redirect } from 'next/navigation';

export default function LabsImportRoute() {
  redirect('/labs?view=import');
}
