import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <div className="min-h-screen bg-[#f4f1ea] text-[#1a1a1a] flex flex-col font-serif">
            <Head title="Verify Email - Te Uekera" />

            {/* Top Newspaper Info Bar */}
            <div className="bg-white border-b border-black py-1 px-6 text-[10px] md:text-sm font-sans flex justify-between items-center tracking-tight font-bold">
                <span>Ana Nuutibeeba ni koaua te I-Kiribati</span>
                <span>Reitaki nakon 63030150</span>
            </div>

            {/* Main Masthead - Simplified for Auth Pages */}
            <div className="bg-[#be1e2d] px-6 py-6 border-b-2 border-black relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/">
                            <ApplicationLogo className="w-16 h-16 shadow-2xl rounded-xl border-2 border-white/20" />
                        </Link>
                        <h1
                            className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none text-white"
                            style={{
                                textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 0 rgba(0,0,0,1)'
                            }}
                        >
                            Te Uekera
                        </h1>
                    </div>

                    <nav className="font-sans font-bold flex gap-4 text-white">
                        <Link href={route('logout')} method="post" as="button" className="bg-[#1a1a1a] hover:bg-black text-white px-6 py-2 rounded transition shadow-lg uppercase tracking-wider text-sm border border-white/20">Log Out</Link>
                    </nav>
                </div>

                {/* Decorative sub-bar effect */}
                <div className="absolute top-0 right-0 h-full w-1/3 bg-[#1e3a8a] -skew-x-12 translate-x-32 hidden lg:block opacity-30 pointer-events-none"></div>
            </div>

            {/* Issue/Date/Price Bar */}
            <div className="bg-[#be1e2d] border-t-2 border-white/20 border-b-4 border-double border-black py-1 px-6 text-white text-[10px] md:text-xs font-sans font-bold flex justify-center items-center italic">
                <span>Account Verification Required</span>
            </div>

            <main className="flex-1 w-full flex flex-col justify-center items-center p-6 relative z-10">
                {/* Verification Card - Matches Landing Page Aesthetics */}
                <div className="w-full max-w-lg bg-white p-10 rounded-[2.5rem] shadow-2xl border-4 border-[#be1e2d]/10 relative overflow-hidden group text-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffde00]/20 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-125"></div>

                    <div className="flex justify-center mb-8">
                        <div className="bg-[#be1e2d]/10 p-4 rounded-full">
                            <svg className="w-12 h-12 text-[#be1e2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    <h3 className="text-3xl font-black uppercase tracking-tighter italic text-[#1a1a1a] mb-6 relative z-10">
                        Verify Your Email
                        <span className="block text-xs font-sans not-italic font-bold text-[#be1e2d] tracking-[0.2em] mt-2 opacity-60">Security Check</span>
                    </h3>

                    <p className="text-gray-600 mb-8 font-serif leading-relaxed text-sm">
                        Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we will gladly send you another.
                    </p>

                    {status === 'verification-link-sent' && (
                        <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-bold shadow-sm">
                            A new verification link has been sent to the email address you provided during registration.
                        </div>
                    )}

                    <form onSubmit={submit} className="relative z-10">
                        <button
                            type="submit"
                            className="w-full py-4 bg-[#1a1a1a] text-white font-black rounded-xl hover:bg-[#be1e2d] transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-50 hover:shadow-red-500/20 active:scale-95 transform duration-200"
                            disabled={processing}
                        >
                            Resend Verification Email
                        </button>
                    </form>
                </div>
            </main>

            <footer className="py-6 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
                    © 2026 Te Uekera Digital
                </p>
            </footer>
        </div>
    );
}
