import { redirect } from 'next/navigation';

export default function LabsCompareRoute() {
  redirect('/labs?view=compare');
}
