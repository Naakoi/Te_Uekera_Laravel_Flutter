import DangerButton from '@/Components/DangerButton';
import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

export default function LogoutOtherDevicesForm({ className = '', status = '', sessions = [], tokens = [] }) {
    const { post, processing, recentlySuccessful } = useForm({});

    const logoutOthers = (e) => {
        e.preventDefault();
        post(route('profile.logout-others'), {
            preserveScroll: true,
        });
    };

    const hasOthers = sessions.some(s => !s.is_current_device) || tokens.length > 0;

    return (
        <section className={className}>
            <header>
                <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 bg-[#be1e2d] text-white rounded shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-1.17-15.351a9.003 9.003 0 0115.357 5.347m-8.474 10.334A9.005 9.005 0 013 12c0-1.268.263-2.474.74-3.571m15-3.571L14 11.586 9.414 7M11 17l2 2 4-4" />
                        </svg>
                    </span>
                    <h2 className="text-lg font-black uppercase text-[#1a1a1a] tracking-tight">Access Control</h2>
                </div>

                <p className="mt-1 text-sm text-gray-600 font-medium italic">
                    Manage your active sessions across web and mobile. Universal security ensures your content stays yours.
                </p>
            </header>

            <div className="mt-6 space-y-4">
                {sessions.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#be1e2d] opacity-80 pl-1">Web Browsers</h3>
                        <div className="space-y-2">
                            {sessions.map((session) => (
                                <div key={session.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${session.is_current_device ? 'bg-green-50/50 border-green-100 shadow-sm' : 'bg-[#f4f1ea]/50 border-black/5'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">
                                            {session.agent?.toLowerCase().includes('mobile') ? '📱' : '💻'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase text-[#1a1a1a] leading-none">{session.location}</span>
                                                {session.is_current_device && (
                                                    <span className="bg-green-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">Active</span>
                                                )}
                                            </div>
                                            <div className="text-[8px] text-gray-500 font-bold truncate max-w-[180px] mt-1 opacity-60 italic">{session.ip_address} • {session.agent}</div>
                                            <div className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{session.last_active}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tokens.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1e3a8a] opacity-80 pl-1">Mobile Devices</h3>
                        <div className="space-y-2">
                            {tokens.map((token) => (
                                <div key={token.id} className="flex items-center justify-between p-4 bg-[#f4f1ea]/50 border border-black/5 rounded-2xl transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">
                                            📡
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-black uppercase text-[#1a1a1a] leading-none">{token.name}</div>
                                            <div className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-1">Last used: {token.last_used_at}</div>
                                        </div>
                                    </div>
                                    <span className="text-[7px] font-black px-1.5 py-0.5 border border-[#1e3a8a]/20 text-[#1e3a8a] rounded tracking-widest uppercase">Verified API Access</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={logoutOthers} className="mt-8">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <DangerButton
                        disabled={processing || !hasOthers}
                        className={`w-full sm:w-auto px-8 py-3 rounded-xl transition-all uppercase tracking-widest font-black text-[10px] shadow-lg ${!hasOthers ? 'opacity-30 cursor-not-allowed grayscale' : 'bg-[#be1e2d] hover:bg-black shadow-red-500/10'}`}
                    >
                        Sign Out From All Other Devices
                    </DangerButton>

                    <Transition
                        show={recentlySuccessful || status === 'device-logout-success'}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest italic flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Security Update Complete
                        </p>
                    </Transition>
                </div>
                {!hasOthers && (
                    <p className="mt-4 text-[9px] font-black text-gray-400 italic uppercase tracking-widest">
                        Your account is currently secure. No other sessions detected.
                    </p>
                )}
            </form>
        </section>
    );
}
