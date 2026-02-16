import { useEffect } from 'react';

import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen bg-[#f4f1ea] text-[#1a1a1a] flex flex-col font-serif">
            <Head title="Log in - Te Uekera" />

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
                        <Link href="/" className="hover:bg-white/10 px-4 py-2 rounded transition">Home</Link>
                        <Link href={route('register')} className="bg-[#1a1a1a] hover:bg-black text-white px-6 py-2 rounded transition shadow-lg uppercase tracking-wider text-sm border border-white/20">Subscribe</Link>
                    </nav>
                </div>

                {/* Decorative sub-bar effect */}
                <div className="absolute top-0 right-0 h-full w-1/3 bg-[#1e3a8a] -skew-x-12 translate-x-32 hidden lg:block opacity-30 pointer-events-none"></div>
            </div>

            {/* Issue/Date/Price Bar */}
            <div className="bg-[#be1e2d] border-t-2 border-white/20 border-b-4 border-double border-black py-1 px-6 text-white text-[10px] md:text-xs font-sans font-bold flex justify-center items-center italic">
                <span>Secure Subscriber & Staff Access</span>
            </div>

            <main className="flex-1 w-full flex flex-col justify-center items-center p-6 relative z-10">
                {/* Login Card - Matches Landing Page Aesthetics */}
                <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-[#be1e2d]/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffde00]/20 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-125"></div>

                    <h3 className="text-3xl font-black uppercase tracking-tighter italic text-[#1a1a1a] mb-8 relative z-10 text-center">
                        Account Login
                        <span className="block text-xs font-sans not-italic font-bold text-[#be1e2d] tracking-[0.2em] mt-1 opacity-60">Subscriber & Staff Portal</span>
                    </h3>

                    {status && <div className="mb-4 font-medium text-sm text-green-600 text-center">{status}</div>}

                    <form onSubmit={submit} className="space-y-6 relative z-10">
                        <div className="space-y-4">
                            <div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    className="w-full bg-[#f4f1ea] border-none rounded-xl text-sm font-bold p-3 placeholder-gray-400 focus:ring-2 focus:ring-[#be1e2d]/20 transition-all shadow-inner"
                                    placeholder="Email Address"
                                    value={data.email}
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    className="w-full bg-[#f4f1ea] border-none rounded-xl text-sm font-bold p-3 placeholder-gray-400 focus:ring-2 focus:ring-[#be1e2d]/20 transition-all shadow-inner"
                                    placeholder="Password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 mb-6">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-gray-300 text-[#be1e2d] shadow-sm focus:ring-[#be1e2d] focus:ring-offset-2 transition-all cursor-pointer bg-[#f4f1ea]"
                                />
                                <span className="ms-2 text-sm text-gray-600 font-bold group-hover:text-[#1a1a1a] transition-colors">Remember me</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-xs text-[#be1e2d] font-bold hover:underline uppercase tracking-wide opacity-80 hover:opacity-100 transition-opacity"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-[#1a1a1a] text-white font-black rounded-xl hover:bg-[#be1e2d] transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-50 hover:shadow-red-500/20 active:scale-95 transform duration-200"
                            disabled={processing}
                        >
                            Log In
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
