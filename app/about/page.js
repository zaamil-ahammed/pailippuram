import PageHeader from '../../components/PageHeader';

export const metadata = { title: 'About and privacy | Nammude Pailippuram' };

export default function About() {
  return (
    <div className="page">
      <PageHeader title="About and privacy" ml="സ്വകാര്യത" />
      <main className="body">
        <header className="card" style={{ textAlign: 'center', padding: '24px 18px', background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Nammude Pailippuram</h1>
          <div className="tagline muted" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary)' }}>
            നമ്മുടെ പൈലിപ്പുറം — നമ്മുടെ നാട്, നമ്മുടെ കൂട്ടായ്മ
          </div>
        </header>

        <section className="card">
          <h2>About Us</h2>
          <p>
            <strong>Nammude Pailippuram</strong> is a digital community platform created to connect the people of Pailippuram, Chembra, Palakkad, Kerala by Victory arts & sports club, Pailippuram
          </p>
          <p>
            Our aim is to bring useful local information, businesses, skilled workers, transportation services, and public information together in one convenient place.
          </p>
        </section>

        <section className="card">
          <h2>Our Mission</h2>
          <p>
            Our mission is to make everyday life easier for the people of Pailippuram by providing a simple, accessible, and useful online platform for our local community.
          </p>
        </section>

        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2>What We Offer</h2>
          <div className="service">
            <h3 style={{ fontSize: '16px', color: 'var(--primary)' }}>1. Important Contacts</h3>
            <p className="muted" style={{ fontSize: '14px' }}>
              Find essential contacts for emergency services, healthcare facilities, government offices, and other important public services.
            </p>
          </div>
          <div className="service">
            <h3 style={{ fontSize: '16px', color: 'var(--primary)' }}>2. Local Shops</h3>
            <p className="muted" style={{ fontSize: '14px' }}>
              Discover local businesses, including grocery stores, bakeries, hotels, pharmacies, hardware shops, mobile shops, and other establishments.
            </p>
          </div>
          <div className="service">
            <h3 style={{ fontSize: '16px', color: 'var(--primary)' }}>3. Native Workers</h3>
            <p className="muted" style={{ fontSize: '14px' }}>
              Find local professionals and skilled workers such as electricians, plumbers, carpenters, mechanics, painters, tutors, and other service providers.
            </p>
          </div>
          <div className="service">
            <h3 style={{ fontSize: '16px', color: 'var(--primary)' }}>4. Transportation Services</h3>
            <p className="muted" style={{ fontSize: '14px' }}>
              Find local auto-rickshaw drivers, taxi services, goods transport, and other transportation options.
            </p>
          </div>
          <div className="service">
            <h3 style={{ fontSize: '16px', color: 'var(--primary)' }}>5. Panchayat</h3>
            <p className="muted" style={{ fontSize: '14px' }}>
              Access useful local-government information, official contacts, public services, announcements, and community updates.
            </p>
          </div>
        </section>

        <section className="card">
          <h2>Our Vision</h2>
          <p>
            We envision a connected Pailippuram where residents can easily find the services they need and local businesses and workers can reach more people.
          </p>
          <p>
            We believe technology should serve our community by making local information accessible and helping people discover opportunities close to home.
          </p>
        </section>

        <section className="card">
          <h2>Community Participation</h2>
          <p>
            Residents, business owners, and service providers can contribute by suggesting businesses, submitting service listings, reporting incorrect information, and recommending useful additions to the platform.
          </p>
          <p>
            Submitted information may be reviewed before publication to help maintain the accuracy and usefulness of the directory.
          </p>
        </section>

        <section className="card disclaimer" style={{ borderLeft: '4px solid #ef4444' }}>
          <h2>Important Disclaimer</h2>
          <p className="muted" style={{ fontSize: '14px' }}>
            Nammude Pailippuram is a community information platform. Unless explicitly stated otherwise, we are not the owners, operators, or official representatives of the businesses and services listed on this website.
          </p>
          <p className="muted" style={{ fontSize: '14px' }}>
            Contact details, availability, prices, opening hours, and other information may change. Users should verify important details directly with the relevant service provider.
          </p>
          <p className="muted" style={{ fontSize: '14px' }}>
            This website does not replace official emergency services. In an emergency, contact the appropriate emergency service directly.
          </p>
        </section>

        <section className="card">
          <h2>Contact Us</h2>
          <p>
            Have a suggestion, correction, or question? We welcome your feedback and contributions to help make Nammude Pailippuram more useful for everyone.
          </p>
          <p style={{ marginTop: '4px' }}>
            <strong>Location:</strong> Pailippuram, Chembra P.O., Palakkad, Kerala, India.
          </p>
        </section>
      </main>
    </div>
  );
}
