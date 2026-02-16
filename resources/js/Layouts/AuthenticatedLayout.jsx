import { useState, useEffect } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link } from '@inertiajs/react';
import ActivationModal from '@/Components/ActivationModal';
import { checkActivationStatus, getDeviceId } from '@/Utils/device';

export default function Authenticated({ user, header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isActivated, setIsActivated] = useState(true);
    const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

    useEffect(() => {
        const verifyActivation = async () => {
            // Set device ID cookie for backend access checks
            const deviceId = getDeviceId();
            document.cookie = `device_id=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;

            // Admins and staff have automatic activation for management
            if (user.role === 'admin' || user.role === 'staff') {
                setIsActivated(true);
                return;
            }

            const activated = await checkActivationStatus();
            setIsActivated(activated);
        };
        verifyActivation();
    }, [user.role, route().current()]);

    return (
        <div className="min-h-screen bg-[#f4f1ea] font-sans">
            <nav className="bg-[#be1e2d] text-white border-b-2 border-black shadow-lg print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex">
                            <div className="shrink-0 flex items-center gap-3">
                                <Link href="/" className="flex items-center gap-3 group">
                                    <ApplicationLogo className="block h-10 w-auto border-2 border-white/20 rounded shadow-sm group-hover:border-white/40 transition-colors" />
                                    <span
                                        className="text-2xl font-black uppercase tracking-tighter text-white"
                                        style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
                                    >
                                        Te Uekera
                                    </span>
                                </Link>
                            </div>

                            <div className="hidden space-x-6 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    className="text-white hover:bg-white/10 px-3 py-1 rounded transition-all font-black uppercase tracking-widest text-xs self-center"
                                >
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    href={route('documents.index')}
                                    active={route().current('documents.index')}
                                    className="text-white hover:bg-white/10 px-3 py-1 rounded transition-all font-black uppercase tracking-widest text-xs self-center"
                                >
                                    Newspapers
                                </NavLink>
                                <NavLink
                                    href={route('documents.library')}
                                    active={route().current('documents.library')}
                                    className="text-white hover:bg-white/10 px-3 py-1 rounded transition-all font-black uppercase tracking-widest text-xs self-center"
                                >
                                    My Library
                                </NavLink>
                                {(user.role === 'admin' || user.can_manage_users) && (
                                    <NavLink
                                        href={route('staff.users.index')}
                                        active={route().current('staff.users.index')}
                                        className="text-[#ffde00] hover:bg-white/10 px-3 py-1 rounded transition-all font-black uppercase tracking-widest text-xs self-center"
                                    >
                                        Manage Users
                                    </NavLink>
                                )}
                                {(user.role === 'admin' || user.can_create_vouchers) && (
                                    <NavLink
                                        href={route('admin.redeem_codes.index')}
                                        active={route().current('admin.redeem_codes.index')}
                                        className="text-[#ffde00] hover:bg-white/10 px-3 py-1 rounded transition-all font-black uppercase tracking-widest text-xs self-center"
                                    >
                                        Manage Codes
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:flex sm:items-center sm:ms-6">
                            <div className="ms-3 relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-sm">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-4 py-2 border-2 border-white/30 text-xs font-black uppercase tracking-widest rounded-sm text-white bg-black/20 hover:bg-black/40 transition"
                                            >
                                                {user.name}

                                                <svg
                                                    className="ms-2 -me-0.5 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>Profile Settings</Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            Log Out Safely
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 transition"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="pt-2 pb-3 space-y-1 bg-white border-b-2 border-black">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('documents.index')} active={route().current('documents.index')}>
                            Newspapers
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('documents.library')} active={route().current('documents.library')}>
                            My Library
                        </ResponsiveNavLink>
                        {(user.role === 'admin' || user.can_manage_users) && (
                            <ResponsiveNavLink href={route('staff.users.index')} active={route().current('staff.users.index')}>
                                User Management
                            </ResponsiveNavLink>
                        )}
                        {(user.role === 'admin' || user.can_create_vouchers) && (
                            <ResponsiveNavLink href={route('admin.redeem_codes.index')} active={route().current('admin.redeem_codes.index')}>
                                Manage Codes
                            </ResponsiveNavLink>
                        )}
                        <hr className="border-black/5 mx-4 my-2" />
                        <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>
                        <ResponsiveNavLink method="post" href={route('logout')} as="button">
                            Log Out
                        </ResponsiveNavLink>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white border-b-4 border-double border-black shadow-sm print:hidden">
                    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-[#1e3a8a] flex items-center justify-between">
                        <div className="shrink-0 border-l-8 border-[#be1e2d] pl-6">
                            <div className="text-3xl font-black uppercase tracking-tighter leading-none italic font-sans">{header}</div>
                        </div>
                        <div className="hidden md:block text-[10px] font-black uppercase opacity-30 italic text-right">
                            Official Archive Access<br />
                            Established 2026
                        </div>
                    </div>
                </header>
            )}

            <main className="py-12 print:p-0">{children}</main>

            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-16 flex items-center justify-around z-50 print:hidden">
                <Link
                    href={route('dashboard')}
                    className={`flex flex-col items-center justify-center w-full h-full ${route().current('dashboard') ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    <span className="text-xs mt-1">Home</span>
                </Link>
                <Link
                    href={route('documents.index')}
                    className={`flex flex-col items-center justify-center w-full h-full ${route().current('documents.index') ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2v6h6"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 13H8m8 4H8m0-8h1"></path>
                    </svg>
                    <span className="text-xs mt-1">Shop</span>
                </Link>
                <Link
                    href={route('documents.library')}
                    className={`flex flex-col items-center justify-center w-full h-full ${route().current('documents.library') ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    <span className="text-xs mt-1">Library</span>
                </Link>
                <Link
                    href={route('profile.edit')}
                    className={`flex flex-col items-center justify-center w-full h-full ${route().current('profile.edit') ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span className="text-xs mt-1">Profile</span>
                </Link>
            </div>

            {/* Add padding to the bottom of the page to avoid being covered by the nav bar on mobile */}
            <div className="sm:hidden h-20"></div>

            {/* Floating Activation Button - Resized & Transparent Glassmorphism */}
            {!isActivated && !isActivationModalOpen && (
                <button
                    onClick={() => setIsActivationModalOpen(true)}
                    className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-black/5 text-[#be1e2d] font-black uppercase tracking-[0.2em] text-[10px] rounded-full shadow-lg hover:bg-[#be1e2d] hover:text-white transition-all hover:-translate-y-1 active:scale-95 group"
                >
                    <div className="bg-[#be1e2d]/10 p-1.5 rounded-full group-hover:bg-white/20 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <span className="opacity-80 group-hover:opacity-100">
                        {route().current('documents.show') ? 'Unlock Edition' : 'Activate Device'}
                    </span>
                </button>
            )}

            <ActivationModal
                isOpen={isActivationModalOpen}
                onClose={() => setIsActivationModalOpen(false)}
                onActivated={() => {
                    setIsActivated(true);
                    window.location.reload();
                }}
                documentId={route().params.document}
            />
        </div>
    );
}
