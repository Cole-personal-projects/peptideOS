import { redirect } from 'next/navigation';

export default function NewStackRoute() {
  redirect('/stacks?add=protocol');
}
