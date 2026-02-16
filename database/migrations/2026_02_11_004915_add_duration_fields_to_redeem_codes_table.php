<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('redeem_codes', function (Blueprint $table) {
            $table->string('duration_type')->default('permanent')->after('code'); // permanent, weekly, monthly
            $table->timestamp('expires_at')->nullable()->after('activated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('redeem_codes', function (Blueprint $table) {
            $table->dropColumn(['duration_type', 'expires_at']);
        });
    }
};
