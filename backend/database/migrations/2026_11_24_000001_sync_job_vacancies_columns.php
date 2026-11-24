<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_vacancies', function (Blueprint $table) {
            if (!Schema::hasColumn('job_vacancies', 'interview_start_date')) {
                $table->date('interview_start_date')->nullable()->after('deadline');
            }
            if (!Schema::hasColumn('job_vacancies', 'interview_end_date')) {
                $table->date('interview_end_date')->nullable()->after('interview_start_date');
            }
            if (!Schema::hasColumn('job_vacancies', 'announcement_date')) {
                $table->date('announcement_date')->nullable()->after('interview_end_date');
            }
            if (!Schema::hasColumn('job_vacancies', 'is_removed_by_admin')) {
                $table->boolean('is_removed_by_admin')->default(false)->after('status');
            }
            if (!Schema::hasColumn('job_vacancies', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('is_removed_by_admin');
            }
        });
    }

    public function down(): void
    {
        Schema::table('job_vacancies', function (Blueprint $table) {
            $columns = array_filter([
                'interview_start_date',
                'interview_end_date',
                'announcement_date',
                'is_removed_by_admin',
                'admin_note',
            ], fn (string $col) => Schema::hasColumn('job_vacancies', $col));

            if (!empty($columns)) {
                $table->dropColumn(array_values($columns));
            }
        });
    }
};
