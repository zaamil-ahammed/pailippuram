import React from 'react';

export default function VictoryClubLandingPage() {
    // Custom styles for animations that were previously in the Tailwind config script
    const customStyles = `
        @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-blob {
            animation: blob 7s infinite;
        }
    `;

    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans flex flex-col relative antialiased selection:bg-white selection:text-black overflow-x-hidden">
            <style>{customStyles}</style>

            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob"></div>
                <div 
                    className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob" 
                    style={{ animationDelay: '2s' }}
                ></div>
                <div 
                    className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob" 
                    style={{ animationDelay: '4s' }}
                ></div>
            </div>

            <button 
                onClick={() => window.history.back()} 
                className="absolute top-6 left-6 group flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-full shadow-sm hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 z-50"
                aria-label="Go to previous page"
            >
                <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Go Back
            </button>

            <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-16 px-6 opacity-0 animate-fade-in-up relative z-10">
                
                <header className="text-center w-full max-w-3xl mx-auto mb-12">
                    {/* Logo */}
                    <div className="relative inline-block mb-6">
                        <img 
                            src="WhatsApp Image 2026-10-13 at 11.15.09 AM.jpeg" 
                            alt="Victory Club Logo" 
                            className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-full shadow-2xl shadow-purple-500/20 border border-white/20 mx-auto bg-white p-2"
                            onError={(e) => { e.target.src = 'https://placehold.co/400x400/ffffff/000000?text=Victory+Logo' }}
                        />
                    </div>
                    
                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white uppercase drop-shadow-sm">
                        Victory <br className="md:hidden" />
                        <span className="block text-2xl md:text-3xl font-semibold mt-2 text-gray-300">Arts & Sports Club</span>
                    </h1>
                    
                    {/* Established Badge */}
                    <div className="inline-block px-3 py-1 border border-white/30 rounded-full text-xs font-bold tracking-widest uppercase mb-6 text-gray-300 bg-white/5 backdrop-blur-sm">
                        ESTD 1994
                    </div>

                    {/* Description */}
                    <div className="px-4">
                        <p className="text-base md:text-lg text-gray-300 leading-relaxed font-light mb-4">
                            Situated in the heart of <strong className="text-white font-medium">Pailippuram, Palakkad district, Kerala</strong>.
                        </p>
                        <p className="text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
                            For over 25 years, Victory has been a cornerstone of cultural and athletic excellence in our community. Since our founding in 1994, we have remained dedicated to nurturing talent, fostering community spirit, and upholding a lasting legacy of excellence in both arts and sports.
                        </p>
                    </div>
                </header>

                <section className="w-full max-w-2xl mx-auto border-t border-white/10 pt-12 text-center">
                    <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2 text-white">
                        Connect With Us
                    </h2>
                    
                    <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
                        Follow us on Instagram to see our latest events, sports matches, and cultural gatherings.
                    </p>
                    
                    <a href="https://www.instagram.com/victory_pailippuram" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold hover:scale-105 transition-transform duration-200 shadow-lg shadow-pink-500/25">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                        </svg>
                        @victory_pailippuram
                    </a>
                </section>
            </main>

            <footer className="mt-auto py-8 text-center text-sm text-gray-500 border-t border-white/10 relative z-10">
                <p>&copy; 2026 Victory Arts & Sports Club. All rights reserved.</p>
                <p className="mt-1 text-xs">Pailippuram, Palakkad Dt, Kerala</p>
            </footer>

        </div>
    );
}