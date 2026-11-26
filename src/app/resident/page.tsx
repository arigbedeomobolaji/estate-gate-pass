import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppNav from '@/components/AppNav';
import PushOptIn from '@/components/PushOptIn';
import { fetchPermits } from '@/lib/data';

export default async function Resident() {
  const u = await getSession();
  if (!u || u.role !== 'RESIDENT') redirect('/login');
  const permits = await fetchPermits(u);
  const today = new Date().toISOString().slice(0, 10);
  const todays = permits.filter(p => p.visitDate.slice(0, 10) === today);

  return (
    <div className="shell">
      <AppNav user={u} />
      <main className="container">
        <h1 className="title">Good morning, {u.fullName.split(' ')[0]}</h1>
        <p className="subtitle">{u.resident?.houseNumber}</p>

        <div style={{ marginTop: 16 }}>
          <PushOptIn />
        </div>

        <div className="actions" style={{ margin: '16px 0' }}>
          <Link className="btn btn-primary" href="/resident/permits/new">+ Create Visitor Permit</Link>
          <Link className="btn btn-ghost" href="/resident/permits">My Permits</Link>
        </div>

        <div className="grid grid-4">
          <div className="card"><div className="label">Today</div><div className="stat">{todays.length}</div><div className="muted">Expected visitors</div></div>
          <div className="card"><div className="label">Entered</div><div className="stat">{todays.filter(p => p.visit?.status === 'INSIDE').length}</div><div className="muted">Currently inside</div></div>
          <div className="card"><div className="label">Awaiting</div><div className="stat">{todays.filter(p => p.visit?.status === 'EXPECTED').length}</div><div className="muted">Awaiting arrival</div></div>
          <div className="card"><div className="label">Total</div><div className="stat">{permits.length}</div><div className="muted">All permits</div></div>
        </div>

        <section className="card" style={{ marginTop: 20 }}>
          <h2>Today's visitors</h2>
          {todays.length === 0
            ? <p className="muted">No visitor permits scheduled today.</p>
            : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Visitor</th><th>Time</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {todays.map(p => (
                      <tr key={p.id}>
                        <td>{p.visitor.fullName}</td>
                        <td>{p.startTime}–{p.endTime}</td>
                        <td><span className={`status ${p.visit?.status === 'INSIDE' ? 'valid' : p.visit?.status === 'DENIED' ? 'invalid' : 'neutral'}`}>{p.visit?.status || p.status}</span></td>
                        <td><Link href={`/resident/permits/${p.id}`}>View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
