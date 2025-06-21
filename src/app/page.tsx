import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect from the root (/) to /1
  redirect('/1');
}
