<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictDevice
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Check if the restriction is enabled
        try {
            if (!\App\Models\SystemSetting::getVal('restrict_mobile_access', false)) {
                return $next($request);
            }
        } catch (\Exception $e) {
            // If table doesn't exist yet, just proceed
            return $next($request);
        }

        // 2. Exclude mobile apps (check for X-Device-Id or X-App-Platform)
        if ($request->hasHeader('X-Device-Id') || $request->hasHeader('X-App-Platform')) {
            return $next($request);
        }

        // 3. Check for restricted devices/browsers (iPhone or Safari)
        $userAgent = $request->header('User-Agent') ?? '';

        // Allow access to the showcase page and its assets to avoid redirect loops
        if ($request->is('showcase.html') || $request->is('assets/*') || $request->is('logo.png')) {
            return $next($request);
        }

        if (str_contains($userAgent, 'iPhone') || 
            (str_contains($userAgent, 'Safari') && !str_contains($userAgent, 'Chrome') && !str_contains($userAgent, 'Chromium') && !str_contains($userAgent, 'Edg'))) {
            return redirect('/showcase.html');
        }

        return $next($request);
    }
}
