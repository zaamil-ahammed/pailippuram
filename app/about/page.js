import PageHeader from '../../components/PageHeader';

export const metadata = { title: 'About and privacy | Nammude Pailippuram' };

export default function About() {
  return (
    <div className="page">
      <PageHeader title="About and privacy" ml="സ്വകാര്യത" />
      <main className="body">
        <p className="error">
          DRAFT TEXT. Before you launch, have this reviewed and replace [bracketed] parts with your real details.
        </p>
        <h2>About</h2>
        <p>
          Nammude Pailippuram is a free community site with local contacts, shops, bus timing, blood donors and
          announcements. It is not run by any government office, panchayath or company.
        </p>
        <h2>What we show</h2>
        <p>
          Only information an admin has approved. Phone numbers of shops and services are shown so people can call
          them. Blood donors are shown only if they agreed to it.
        </p>
        <h2>What we collect</h2>
        <p>
          When you share information or ask for a correction, we store what you type. Your own contact details, if you
          add them, are private: only admins can see them, and they are used only to reply to you. We do not sell data
          and we do not run adverts.
        </p>
        <h2>Remove your details</h2>
        <p>
          Anyone can ask for their details to be corrected or removed from the correction page. We aim to respond
          within 48 hours.
        </p>
        <h2>Contact</h2>
        <p>[Your contact email or phone number]</p>
      </main>
    </div>
  );
}
