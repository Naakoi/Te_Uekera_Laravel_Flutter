<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        \App\Models\User::create([
            'name' => 'Admin User',
            'email' => 'admin@uekera.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        \App\Models\User::create([
            'name' => 'Staff Member',
            'email' => 'staff@uekera.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'staff',
            'email_verified_at' => now(),
        ]);

        \App\Models\User::create([
            'name' => 'Client User',
            'email' => 'client@uekera.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'client',
            'email_verified_at' => now(),
        ]);
    }
}
