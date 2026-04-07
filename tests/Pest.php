<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Laravel\Fortify\Features;
use PHPUnit\Framework\SkippedWithMessageException;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)->use(RefreshDatabase::class)->in('Feature');

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * @param  Closure(AssertableInertia):void  $assert
 */
function assertInertiaPage(TestResponse $response, Closure $assert): TestResponse
{
    $assert(AssertableInertia::fromTestResponse($response));

    return $response;
}

function skipUnlessFortifyFeature(string $feature): void
{
    if (! Features::enabled($feature)) {
        throw new SkippedWithMessageException(
            sprintf('The [%s] feature is not enabled.', $feature),
        );
    }
}
