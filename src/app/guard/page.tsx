import {redirect} from 'next/navigation'; import {getSession} from '@/lib/auth'; import AppNav from '@/components/AppNav'; import GuardClient from './GuardClient';
export default async function Guard(){const u=await getSession();if(!u||u.role!=='GUARD')redirect('/login');return <div className="shell"><AppNav user={u}/><main className="container"><GuardClient/></main></div>}
