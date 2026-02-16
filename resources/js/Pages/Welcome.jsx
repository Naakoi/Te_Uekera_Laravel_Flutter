import { Link, Head, useForm } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { useState, useEffect } from 'react';

export default function Welcome({ auth }) {
    const [challenge, setChallenge] = useState({ animal: 'Dog', translation: 'kamea' });

    useEffect(() => {
        const challenges = [
            { animal: 'Dog', translation: 'kamea' },
            { animal: 'Cat', translation: 'katia' },
            { animal: 'Pig', translation: 'beeki' },
            { animal: 'Chicken', translation: 'moa' },
            { animal: 'Fish', translation: 'ika' }
        ];
        setChallenge(challenges[Math.floor(Math.random() * challenges.length)]);
    }, []);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        bot_trap: '',
        human_verification: '',
    });

    const submitRegister = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-[#f4f1ea] text-[#1a1a1a] flex flex-col font-serif">
            <Head title="Te Uekera - Digital Newspaper" />

            {/* Top Newspaper Info Bar */}
            <div className="bg-white border-b border-black py-1 px-6 text-[10px] md:text-sm font-sans flex justify-between items-center tracking-tight font-bold">
                <span>Ana Nuutibeeba ni koaua te I-Kiribati</span>
                <span>Reitaki nakon 63030150</span>
            </div>

            {/* Main Masthead */}
            <div className="bg-[#be1e2d] px-6 py-6 border-b-2 border-black relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <ApplicationLogo className="w-20 h-20 shadow-2xl rounded-xl border-2 border-white/20" />
                        <h1
                            className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-none text-white"
                            style={{
                                textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 6px 0 rgba(0,0,0,1)'
                            }}
                        >
                            Te Uekera
                        </h1>
                    </div>

                    <nav className="font-sans font-bold flex gap-4 text-white">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="hover:bg-white/10 px-4 py-2 rounded transition">Dashboard</Link>
                        ) : (
                            <Link href={route('login')} className="bg-[#1a1a1a] hover:bg-black text-white px-6 py-2 rounded transition shadow-lg uppercase tracking-wider text-sm border border-white/20">Login</Link>
                        )}
                    </nav>
                </div>

                {/* Decorative sub-bar effect */}
                <div className="absolute top-0 right-0 h-full w-1/3 bg-[#1e3a8a] -skew-x-12 translate-x-32 hidden lg:block opacity-30 pointer-events-none"></div>
            </div>

            {/* Issue/Date/Price Bar */}
            <div className="bg-[#be1e2d] border-t-2 border-white/20 border-b-4 border-double border-black py-1 px-6 text-white text-[10px] md:text-xs font-sans font-bold flex justify-between items-center italic">
                <span>Issue nambwa 1</span>
                <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span>$1.00</span>
            </div>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 relative z-10">
                {/* Hero Section - Premier Modern */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-24 items-start">
                    <div className="lg:col-span-3">
                        <div className="inline-block bg-[#be1e2d] text-white px-5 py-1 text-sm font-black uppercase tracking-[0.2em] mb-8 rounded-full shadow-lg shadow-red-500/20">Headline News</div>
                        <h2
                            className="text-5xl md:text-7xl font-black mb-10 leading-[0.9] text-[#1a1a1a] uppercase font-display subpixel-antialiased"
                            style={{ textRendering: 'optimizeLegibility' }}
                        >
                            THE FUTURE OF NEWS, <br />
                            <span className="text-[#be1e2d] font-sans font-bold relative inline-block tracking-tight">
                                DIGITALLY SECURED WORLD
                                <span className="absolute -bottom-2 left-0 w-full h-2 bg-[#ffde00] -z-10 opacity-50"></span>
                            </span>
                        </h2>
                        <p className="text-2xl md:text-4xl leading-tight text-gray-800 max-w-4xl italic mb-12 border-l-8 border-[#be1e2d] pl-8 py-2 font-medium">
                            Access the latest editions of Te Uekera from anywhere in the world. High-quality news for our community.
                        </p>

                        <div className="flex flex-col md:flex-row gap-12 items-start">
                            <Link
                                href={route('documents.index')}
                                className="px-14 py-6 bg-[#be1e2d] text-white font-sans font-black rounded-2xl shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-1 transition-all uppercase tracking-widest text-lg active:scale-95 text-center w-full md:w-auto"
                            >
                                Browse Editions
                            </Link>

                            {!auth.user && (
                                <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-[#be1e2d]/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffde00]/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform"></div>

                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-[#1a1a1a] mb-6 relative z-10">
                                        Join Our Community
                                        <span className="block text-xs font-sans not-italic font-bold text-[#be1e2d] tracking-[0.2em] mt-1 opacity-60">Free Registration</span>
                                    </h3>

                                    <form onSubmit={submitRegister} className="space-y-4 relative z-10">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <input
                                                    type="text"
                                                    className="w-full bg-[#f4f1ea] border-none rounded-xl text-sm font-bold p-3 placeholder-gray-400 focus:ring-2 focus:ring-[#be1e2d]/20 transition-all shadow-inner"
                                                    placeholder="Full Name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    required
                                                />
                                                {errors.name && <div className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.name}</div>}
                                            </div>
                                            <div>
                                                <input
                                                    type="email"
                                                    className="w-full bg-[#f4f1ea] border-none rounded-xl text-sm font-bold p-3 placeholder-gray-400 focus:ring-2 focus:ring-[#be1e2d]/20 transition-all shadow-inner"
                                                    placeholder="Email Address"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    required
                                                />
                                                {errors.email && <div className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.email}</div>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <input
                                                    type="password"
                                                    className="w-full bg-[#f4f1ea] border-none rounded-xl text-sm font-bold p-3 placeholder-gray-400 focus:ring-2 focus:ring-[#be1e2d]/20 transition-all shadow-inner"
                                                    placeholder="Password"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    required
                                                />
                                                {errors.password && <div className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.password}</div>}
                                            </div>
                                            <div>
                                                <input
                                                    type="password"
                                                    className="w-full bg-[#f4f1ea] border-none rounded-xl text-sm font-bold p-3 placeholder-gray-400 focus:ring-2 focus:ring-[#be1e2d]/20 transition-all shadow-inner"
                                                    placeholder="Confirm PW"
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Anti-Robot Measures */}
                                        <div className="hidden">
                                            <input
                                                type="text"
                                                name="bot_trap"
                                                value={data.bot_trap}
                                                onChange={(e) => setData('bot_trap', e.target.value)}
                                                tabIndex="-1"
                                                autoComplete="off"
                                            />
                                        </div>

                                        <div className="bg-[#be1e2d]/5 p-3 rounded-xl border border-[#be1e2d]/10">
                                            <label className="block text-[10px] uppercase font-black tracking-widest text-[#be1e2d] mb-1">
                                                Verification: What is "{challenge.animal}" in Kiribati?
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border-2 border-[#be1e2d]/10 rounded-lg text-xs font-bold p-2 focus:border-[#be1e2d] focus:ring-0 transition-all"
                                                placeholder={`Type '${challenge.translation}'`}
                                                value={data.human_verification}
                                                onChange={(e) => setData('human_verification', e.target.value)}
                                                required
                                            />
                                            <p className="text-[9px] text-gray-500 font-bold italic mt-1">Proof of humanity required.</p>
                                            {errors.human_verification && <div className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.human_verification}</div>}
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-[#1a1a1a] text-white font-black rounded-xl hover:bg-[#be1e2d] transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-50"
                                            disabled={processing}
                                        >
                                            Create Secure Account
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Paper Mockup Sidebar - Premier Asset */}
                    <div className="lg:col-span-1 hidden lg:block">
                        <div className="sticky top-12 group cursor-pointer">
                            <div className="relative transform transition-all duration-500 group-hover:scale-105 group-hover:-rotate-2">
                                <img
                                    src="/newspaper_mockup.png"
                                    alt="Latest Edition Mockup"
                                    className="w-full rounded-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white/20"
                                />
                                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10"></div>
                            </div>
                            <div className="mt-8 text-center">
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-[#be1e2d]">Latest Edition</span>
                                <h4 className="mt-1 font-display font-black text-xl italic uppercase">Issue #186 - 2026</h4>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Grid - Modern Glass Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 font-sans mb-32">
                    <div className="p-10 bg-white/70 backdrop-blur-md border border-black/5 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#be1e2d]/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                        <h3 className="text-2xl font-black mb-6 uppercase text-[#be1e2d] tracking-tight font-display">Pay Per View</h3>
                        <p className="text-lg text-gray-800 leading-relaxed font-serif italic relative z-10">
                            "Only pay for what you read. Single editions available for just $1 each. Quality journalism at an affordable price."
                        </p>
                        <div className="mt-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-40">
                            <span className="w-8 h-[1px] bg-black"></span>
                            Official Price Point
                        </div>
                    </div>

                    <div className="p-10 bg-[#1a1a1a] border border-white/5 rounded-3xl shadow-2xl hover:shadow-black/40 hover:-translate-y-2 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                        <h3 className="text-2xl font-black mb-6 uppercase text-[#ffde00] tracking-tight font-display">Secure Access</h3>
                        <p className="text-lg text-white/90 leading-relaxed font-serif italic relative z-10">
                            "Our advanced file protection ensures your purchased documents stay yours. Read securely on any device."
                        </p>
                        <div className="mt-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#ffde00]/50">
                            <span className="w-8 h-[1px] bg-[#ffde00]/30"></span>
                            Privacy Guaranteed
                        </div>
                    </div>

                    <div className="p-10 bg-[#ffde00] border border-black/5 rounded-3xl shadow-xl hover:shadow-[#ffde00]/40 hover:-translate-y-2 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                        <h3 className="text-2xl font-black mb-6 uppercase text-[#1e3a8a] tracking-tight font-display">Mobile App</h3>
                        <p className="text-lg text-[#1e3a8a] font-bold leading-tight font-sans uppercase relative z-10">
                            Install our app for offline reading and instant news alerts. Just add to home screen!
                        </p>
                        <div className="mt-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#be1e2d]">
                            <span className="w-8 h-[1px] bg-[#be1e2d]/30"></span>
                            Read Anywhere
                        </div>
                    </div>
                </div>

                {/* App Detailed Promo - Modern Glassmorphism */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#be1e2d]/20 to-[#1e3a8a]/20 blur-3xl opacity-30 -z-10 group-hover:opacity-50 transition-opacity"></div>
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/40 p-12 lg:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffde00]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                            <div className="flex-1">
                                <span className="bg-[#be1e2d] text-white px-6 py-1.5 text-xs font-black uppercase tracking-[0.3em] mb-8 inline-block rounded-full">Premier Mobile</span>
                                <h3 className="text-6xl md:text-7xl font-black mb-10 uppercase tracking-tighter leading-none font-display text-[#1a1a1a]">Read Anywhere.</h3>
                                <p className="text-gray-800 text-2xl mb-12 leading-relaxed font-serif italic border-l-8 border-[#ffde00] pl-10 py-2">
                                    Our new digital experience allows you to download full newspaper editions and read them offline, anytime, anywhere.
                                </p>

                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-14 font-sans font-black uppercase text-xs tracking-widest text-black/60">
                                    <li className="flex items-center gap-5">
                                        <div className="bg-[#1a1a1a] text-white p-3 rounded-2xl shadow-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></div>
                                        <span>Breaking Alerts</span>
                                    </li>
                                    <li className="flex items-center gap-5">
                                        <div className="bg-[#1a1a1a] text-white p-3 rounded-2xl shadow-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div>
                                        <span>Offline Journal</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => window.alert('To install: \n\nOn iOS: Tap Share -> Add to Home Screen\nOn Android: Tap Menu -> Install App')}
                                    className="group relative inline-flex items-center gap-4 bg-[#1a1a1a] text-white px-14 py-6 rounded-3xl font-black transition-all hover:bg-[#be1e2d] hover:shadow-[0_20px_40px_-10px_rgba(190,30,45,0.4)] uppercase tracking-widest text-lg overflow-hidden"
                                >
                                    <span className="relative z-10">Get the App</span>
                                    <svg className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                </button>
                            </div>

                            <div className="hidden lg:block relative group-hover:scale-105 transition-transform duration-700">
                                <div className="w-80 h-[550px] bg-[#1a1a1a] rounded-[3.5rem] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-white/5 relative overflow-hidden flex flex-col">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-3xl"></div>
                                    <div className="mt-8 flex-1 bg-[#f4f1ea] rounded-[2.5rem] overflow-hidden flex flex-col shadow-inner">
                                        <div className="h-14 bg-[#be1e2d] flex items-center px-6">
                                            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                                        </div>
                                        <div className="p-6">
                                            <div className="h-4 bg-black/5 w-3/4 mb-4 rounded-full"></div>
                                            <div className="h-40 bg-black/5 w-full rounded-2xl mb-6"></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="h-24 bg-black/5 rounded-2xl"></div>
                                                <div className="h-24 bg-black/5 rounded-2xl"></div>
                                            </div>
                                        </div>
                                        <div className="mt-auto h-20 bg-white border-t border-black/5 flex justify-around items-center px-8">
                                            <div className="w-10 h-10 bg-black/5 rounded-2xl flex items-center justify-center"><div className="w-4 h-4 bg-black/10 rounded-sm"></div></div>
                                            <div className="w-12 h-12 bg-[#be1e2d] rounded-2xl shadow-lg shadow-red-500/30"></div>
                                            <div className="w-10 h-10 bg-black/5 rounded-2xl flex items-center justify-center"><div className="w-4 h-4 bg-black/10 rounded-sm"></div></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#ffde00]/20 blur-3xl rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-32 pb-20 px-8 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <div className="flex flex-col md:flex-row justify-between items-center w-full gap-12 bg-white/30 backdrop-blur-sm p-12 rounded-[2.5rem] border border-white/40 shadow-xl">
                        <div className="flex items-center gap-6">
                            <div className="p-3 bg-white rounded-2xl shadow-lg shadow-black/5 border border-black/5">
                                <ApplicationLogo className="w-10 h-10 grayscale opacity-40" />
                            </div>
                            <div>
                                <h5 className="font-display font-black text-[#1a1a1a] uppercase text-sm tracking-widest italic">Te Uekera Digital</h5>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-1">
                                    © 2026 Serving the Community
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
                            {['Privacy Policy', 'Terms of Service', 'Support'].map((item) => (
                                <a key={item} href="#" className="text-xs font-black uppercase tracking-[0.2em] text-black/40 hover:text-[#be1e2d] transition-colors relative group">
                                    {item}
                                    <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-[#be1e2d] transition-all group-hover:w-full"></span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
