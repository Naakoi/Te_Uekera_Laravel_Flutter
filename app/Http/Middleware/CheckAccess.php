<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        if (!$user) {
            return redirect()->route('login');
        }

        // Admin and Staff always have access
        if ($user->isAdmin() || $user->isStaff()) {
            return $next($request);
        }

        $document = $request->route('document');
        if (!$document) {
            return $next($request);
        }

        // Check for active subscription
        if ($user->hasActiveSubscription()) {
            return $next($request);
        }

        // Check for individual purchase
        if ($user->purchases()->where('document_id', $document->id)->exists()) {
            return $next($request);
        }

        return redirect()->route('subscription.index')->with('info', 'Please subscribe or purchase this document to view it.');
    }
}
