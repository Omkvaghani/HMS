<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_engine_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->unique()->constrained('hotels')->cascadeOnDelete();
            $table->string('hero_headline')->nullable();
            $table->text('hero_subheadline')->nullable();
            $table->string('hero_image_url')->nullable();
            $table->string('primary_color', 9)->default('#8B5E34'); // hospitality-warm default
            $table->string('accent_color', 9)->default('#D4A574');
            $table->string('font_family')->default('Inter');
            $table->json('gallery_image_urls')->nullable();
            $table->text('about_text')->nullable();
            $table->text('cancellation_policy')->nullable();
            $table->text('terms_and_conditions')->nullable();
            $table->string('seo_title')->nullable();
            $table->string('seo_description')->nullable();
            $table->string('seo_image_url')->nullable();
            $table->json('social_links')->nullable();
            $table->boolean('show_addons')->default(true);
            $table->boolean('require_phone')->default(true);
            $table->boolean('require_id_upload')->default(false);
            $table->timestamps();
        });

        Schema::create('public_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->enum('charge_type', ['PER_STAY', 'PER_NIGHT', 'PER_PERSON', 'PER_PERSON_PER_NIGHT'])->default('PER_STAY');
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_addons');
        Schema::dropIfExists('booking_engine_configs');
    }
};
