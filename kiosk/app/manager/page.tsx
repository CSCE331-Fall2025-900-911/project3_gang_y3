

import { getManagerData } from '../../lib/managerData';
import ManagerPageClient from './ManagerPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ManagerPage() {
  const data = await getManagerData();
  return <ManagerPageClient initialData={data} />;
}
