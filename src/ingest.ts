import { supabase } from './db';
import { JobListingInsert } from './types';

// In a real scenario, this would potentially take a generic type for the raw source job
export async function normalizeAndUpsertJob(rawJob: any, platform: string): Promise<void> {
    try {
        const job = normalizeJob(rawJob, platform);

        console.log(`Upserting job: ${platform}:${job.external_id} - ${job.title}`);

        const { error } = await supabase
            .from('job_listings')
            .upsert(job, {
                onConflict: 'platform,external_id',
            });

        if (error) {
            console.error(`Error upserting job ${job.external_id}:`, error);
        } else {
            console.log(`Successfully upserted job ${job.external_id}`);
        }

    } catch (e) {
        console.error("Failed to normalize job:", e);
    }
}

function normalizeJob(raw: any, platform: string): JobListingInsert {
    // This is a stub normalization. In reality, you'd switch on platform.

    // Example normalization logic
    const external_id = raw.id || raw.guid || 'unknown_id';
    const title = raw.title || 'Untitled Job';

    return {
        platform,
        external_id: String(external_id),
        title,
        description: raw.description || null,
        url: raw.link || raw.url || null,
        hourly_rate_min: raw.hourly_min || null,
        hourly_rate_max: raw.hourly_max || null,
        fixed_price: raw.budget || null,
        client_payment_verified: raw.client?.verified || false,
        client_total_spent: raw.client?.spent || 0,
        client_country: raw.client?.country || null,
        skills: raw.skills || [],
        raw: raw, // CRITICAL: Never drop data
        posted_at: raw.posted_at ? new Date(raw.posted_at).toISOString() : null,
    };
}
