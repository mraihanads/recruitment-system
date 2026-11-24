<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_vacancies', function (Blueprint $table) {
            if (!Schema::hasColumn('job_vacancies', 'interview_method')) {
                $table->enum('interview_method', ['online', 'offline', 'both'])
                    ->nullable()
                    ->default('online')
                    ->after('deadline');
            }
        });
    }

    public function down(): void
    {
        Schema::table('job_vacancies', function (Blueprint $table) {
            if (Schema::hasColumn('job_vacancies', 'interview_method')) {
                $table->dropColumn('interview_method');
            }
        });
    }
};
