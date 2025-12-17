

import { auth } from '../../lib/auth';
import { getManagerData } from '../../lib/managerData';
import ManagerPageClient from './ManagerPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ManagerPage() {
  const [data, session] = await Promise.all([
    getManagerData(),
    auth()
  ]);

  return <ManagerPageClient initialData={data} session={session} />;
}
