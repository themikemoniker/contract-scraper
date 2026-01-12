import { normalizeAndUpsertJob } from './ingest';

async function main() {
    console.log("Starting ingestion worker...");

    // Mock generic fetcher logic
    // In production, this would use specific fetchers for Upwork/Fiverr
    const mockJobs = [
        {
            id: '12345',
            title: 'Need a React Developer',
            description: 'Building a dashboard.',
            hourly_min: 30,
            hourly_max: 50,
            client: { verified: true, country: 'USA' },
            posted_at: new Date().toISOString()
        },
        {
            guid: 'abc-789',
            title: 'Fix my Python script',
            budget: 100,
            client: { verified: false },
            skills: ['Python', 'Scripting']
        }
    ];

    console.log(`Fetched ${mockJobs.length} mock jobs.`);

    for (const job of mockJobs) {
        // We pretend these come from 'mock_platform'
        await normalizeAndUpsertJob(job, 'mock_platform');
    }

    console.log("Ingestion finished.");
}

main().catch(console.error);
