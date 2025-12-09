import ManagerClient from './ManagerClient';
import { getManagerData } from '../../lib/managerData';

export default async function ManagerView() {
  const data = await getManagerData();
  return <ManagerClient initialData={data} />;
}
