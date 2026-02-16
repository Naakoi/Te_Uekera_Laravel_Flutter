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
            $table->foreignId('document_id')->nullable()->after('id')->constrained()->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('redeem_codes', function (Blueprint $table) {
            $table->dropForeign(['document_id']);
            $table->dropColumn('document_id');
        });
    }
};
