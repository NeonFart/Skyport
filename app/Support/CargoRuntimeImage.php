<?php

namespace App\Support;

class CargoRuntimeImage
{
    /**
     * @param  array<string, string>|null  $dockerImages
     */
    public static function resolve(?array $dockerImages, ?string $selectedImage = null): ?string
    {
        $dockerImages ??= [];

        if ($selectedImage && in_array($selectedImage, $dockerImages, true)) {
            return $selectedImage;
        }

        $highestJavaImage = self::highestJavaImage($dockerImages);

        if ($highestJavaImage) {
            return $highestJavaImage;
        }

        return array_values($dockerImages)[0] ?? null;
    }

    /**
     * @param  array<string, string>|null  $dockerImages
     */
    public static function labelFor(?array $dockerImages, ?string $selectedImage = null): ?string
    {
        $resolvedImage = self::resolve($dockerImages, $selectedImage);

        if (! $resolvedImage || ! is_array($dockerImages)) {
            return null;
        }

        foreach ($dockerImages as $label => $image) {
            if ($image === $resolvedImage) {
                return (string) $label;
            }
        }

        return null;
    }

    /**
     * @param  array<string, string>  $dockerImages
     */
    protected static function highestJavaImage(array $dockerImages): ?string
    {
        $highestVersion = null;
        $highestImage = null;

        foreach ($dockerImages as $label => $image) {
            $version = self::parseJavaMajorVersion((string) $label);

            if ($version === null) {
                continue;
            }

            if ($highestVersion === null || $version > $highestVersion) {
                $highestVersion = $version;
                $highestImage = (string) $image;
            }
        }

        return $highestImage;
    }

    protected static function parseJavaMajorVersion(string $label): ?int
    {
        if (! preg_match('/\d+/', $label, $matches)) {
            return null;
        }

        return isset($matches[0]) ? (int) $matches[0] : null;
    }
}
