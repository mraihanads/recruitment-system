<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('job_vacancies')->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('candidate_profiles')->cascadeOnDelete();
            $table->string('cv_file', 255)->nullable();
            $table->text('cover_letter')->nullable();
            $table->enum('status', [
                'submitted',
                'screening',
                'interview',
                'test',
                'accepted',
                'rejected',
            ])->default('submitted');
            $table->decimal('match_percentage', 5, 2)->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->timestamps();

            $table->unique(['job_id', 'candidate_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
