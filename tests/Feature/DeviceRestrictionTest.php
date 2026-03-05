<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class DeviceRestrictionTest extends TestCase
{
    /** @test */
    public function iphone_is_redirected_to_showcase_when_restriction_enabled()
    {
        \App\Models\SystemSetting::setVal('restrict_mobile_access', '1', 'boolean');

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
        ])->get('/');

        $response->assertRedirect('/showcase.html');
    }

    /** @test */
    public function safari_desktop_is_redirected_to_showcase_when_restriction_enabled()
    {
        \App\Models\SystemSetting::setVal('restrict_mobile_access', '1', 'boolean');

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15'
        ])->get('/');

        $response->assertRedirect('/showcase.html');
    }

    /** @test */
    public function mobile_app_is_NOT_redirected_even_with_iphone_user_agent()
    {
        \App\Models\SystemSetting::setVal('restrict_mobile_access', '1', 'boolean');

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
            'X-App-Platform' => 'mobile_app'
        ])->get('/');

        $response->assertStatus(200);
    }

    /** @test */
    public function chrome_is_NOT_redirected()
    {
        \App\Models\SystemSetting::setVal('restrict_mobile_access', '1', 'boolean');

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        ])->get('/');

        $response->assertStatus(200);
    }

    /** @test */
    public function restriction_is_ignored_when_disabled_in_settings()
    {
        \App\Models\SystemSetting::setVal('restrict_mobile_access', '0', 'boolean');

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
        ])->get('/');

        $response->assertStatus(200);
    }
}
