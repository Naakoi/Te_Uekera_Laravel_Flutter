import DangerButton from '@/Components/DangerButton';
import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

export default function LogoutOtherDevicesForm({ className = '', status = '' }) {
    const { post, processing, recentlySuccessful } = useForm({});

    const logoutOthers = (e) => {
        e.preventDefault();
        post(route('profile.logout-others'), {
            preserveScroll: true,
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-black uppercase text-[#1a1a1a] tracking-tight">Active Sessions</h2>

                <p className="mt-1 text-sm text-gray-600 font-medium italic">
                    If you’ve left your account logged in on another device, you can sign out of all other active sessions here. This will affect both web browsers and the mobile app.
                </p>
            </header>

            <form onSubmit={logoutOthers} className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                    <DangerButton
                        disabled={processing}
                        className="bg-[#be1e2d] hover:bg-black transition-all uppercase tracking-widest font-black text-[10px]"
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
                        <p className="text-sm font-bold text-green-600 uppercase tracking-widest italic">Successfully signed out others.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
