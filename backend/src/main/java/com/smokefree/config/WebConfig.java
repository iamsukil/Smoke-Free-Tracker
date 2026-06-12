package com.smokefree.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

/**
 * Configures Spring MVC static resource serving.
 *
 * Spring Boot auto-configures classpath:/static/ as a resource location and
 * automatically maps / → /index.html (welcome page) out of the box.
 *
 * This class adds:
 *  1. Long-lived cache headers for fingerprinted assets (css/, js/, icons/)
 *  2. No-cache for HTML pages so the browser always fetches the latest markup
 *  3. No-cache for service-worker.js and manifest.json (PWA requirements)
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // ── Fingerprinted assets: cache aggressively ──────────────────────
        registry.addResourceHandler("/css/**", "/js/**", "/icons/**")
                .addResourceLocations("classpath:/static/css/",
                                      "classpath:/static/js/",
                                      "classpath:/static/icons/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic());

        // ── HTML pages: never cache so updates are picked up immediately ──
        registry.addResourceHandler("/*.html")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noStore());

        // ── PWA files: no-cache (browsers must re-validate every time) ────
        registry.addResourceHandler("/service-worker.js", "/manifest.json")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noStore());
    }
}
