import PageHeader from '../../../components/PageHeader';

export default function Admins() {
  return (
    <div className="page">
      <PageHeader title="Admins and roles" back="/admin" backLabel="Admin" />
      <main className="body">
        <p>
          Admins are set up in the database, not on this page, so nobody can make themselves an admin from the website.
          Having at least two admins means the site never depends on one person.
        </p>
        <h2>To add an admin</h2>
        <div className="steps">
          <div className="step"><b>1</b><span>In Supabase, open Authentication, Users, Add user. Enter their email and a password.</span></div>
          <div className="step"><b>2</b><span>Copy that user's UID.</span></div>
          <div className="step"><b>3</b><span>In SQL Editor run: insert into admins (user_id) values ('PASTE-THE-UID-HERE');</span></div>
        </div>
        <p className="muted small">To remove an admin: delete from admins where user_id = 'THE-UID';</p>
      </main>
    </div>
  );
}
