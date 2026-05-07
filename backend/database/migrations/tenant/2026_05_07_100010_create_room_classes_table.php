<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('max_adults')->default(2);
            $table->unsignedSmallInteger('max_children')->default(0);
            $table->unsignedSmallInteger('max_occupancy')->default(2);
            $table->unsignedSmallInteger('bed_count')->default(1);
            $table->string('bed_type')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->decimal('weekend_price', 10, 2)->nullable();
            $table->decimal('extra_adult_price', 10, 2)->default(0);
            $table->decimal('extra_child_price', 10, 2)->default(0);
            $table->json('amenities')->nullable();
            $table->json('image_urls')->nullable();
            $table->unsignedInteger('size_sqft')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['hotel_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_classes');
    }
};
