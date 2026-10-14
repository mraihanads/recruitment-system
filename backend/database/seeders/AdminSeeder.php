<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update existing admin or create new one
        $admin = User::where('role', 'admin')->first();

        if ($admin) {
            $admin->update([
                'name' => 'Super Admin',
                'email' => 'recruitment@gmail.com',
                'password' => Hash::make('A12345678'),
                'status' => 'active',
            ]);
        } else {
            User::updateOrCreate(
                ['email' => 'recruitment@gmail.com'],
                [
                    'name' => 'Super Admin',
                    'password' => Hash::make('A12345678'),
                    'role' => 'admin',
                    'status' => 'active',
                ]
            );
        }
    }
}
