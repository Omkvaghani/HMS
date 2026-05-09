<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class BookingEngineConfig extends Model
{
    protected $fillable = [
        'hotel_id', 'hero_headline', 'hero_subheadline', 'hero_image_url',
        'primary_color', 'accent_color', 'font_family',
        'gallery_image_urls', 'about_text',
        'cancellation_policy', 'terms_and_conditions',
        'seo_title', 'seo_description', 'seo_image_url', 'social_links',
        'show_addons', 'require_phone', 'require_id_upload',
    ];

    protected $casts = [
        'gallery_image_urls' => 'array',
        'social_links' => 'array',
        'show_addons' => 'boolean',
        'require_phone' => 'boolean',
        'require_id_upload' => 'boolean',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }
}
