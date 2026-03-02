import { Link } from '@inertiajs/react';

export default function NavLink({ active = false, className = '', children, ...props }) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center px-1 pt-1 border-b-2 text-[10px] md:text-sm font-black uppercase tracking-widest leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-white text-white focus:border-white '
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/50 focus:text-white focus:border-white/50 ') +
                className
            }
        >
            {children}
        </Link>
    );
}
