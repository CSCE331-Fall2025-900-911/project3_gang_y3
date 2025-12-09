import ManagerClient from './ManagerClient';
import { getManagerData } from '../../lib/managerData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ManagerView() {
  const data = await getManagerData();
  return <ManagerClient initialData={data} />;
}
